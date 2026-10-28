import assert from "node:assert/strict";
import http from "node:http";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";

// Entirely isolated WooCommerce fixture: this test never submits a real order,
// sends email, contacts a payment gateway, or uses customer credentials.
const currency = { currency_code: "BDT", currency_symbol: "৳", currency_minor_unit: 2, currency_prefix: "", currency_suffix: "৳", currency_decimal_separator: ".", currency_thousand_separator: "," };
const blank = { first_name: "", last_name: "", company: "", address_1: "", address_2: "", city: "", state: "", postcode: "", country: "BD", email: "", phone: "" };
const sessions = new Map();
const orders = new Map();
let sequence = 0, submitted = 0, dropAfterOrder = false, unavailable = false;
const counters = { mutations: 0 };
function token(session) { const t = `fixture-${++sequence}`; sessions.set(t, session); return t; }
function cart(session) {
  const subtotal = session.items.reduce((sum, i) => sum + i.quantity * 1500, 0);
  const shipping = session.items.length && session.shipping.state ? session.rate === "express:2" ? 10000 : 6000 : null;
  const discount = session.coupon ? Math.round(subtotal / 10) : 0;
  return { items: session.items.map((i) => ({ key: i.key, id: i.id, name: "Test cream", quantity: i.quantity, permalink: "/product/test", variation: [{ attribute: "Size", value: "Small" }], images: [], quantity_limits: { minimum: 1, maximum: 10, multiple_of: 1, editable: true }, totals: { ...currency, line_total: String(i.quantity * 1500), line_subtotal: String(i.quantity * 1500) } })), items_count: session.items.reduce((n, i) => n + i.quantity, 0),
    coupons: session.coupon ? [{ code: "SAVE10" }] : [], totals: { ...currency, total_items: String(subtotal), total_discount: String(discount), total_fees: "0", total_shipping: shipping === null ? null : String(shipping), total_tax: "0", total_price: String(subtotal - discount + (shipping ?? 0)) },
    billing_address: session.billing, shipping_address: session.shipping, needs_shipping: Boolean(session.items.length), has_calculated_shipping: shipping !== null,
    payment_methods: session.shipping.state === "BD-64" ? [] : ["cod"], errors: [],
    shipping_rates: shipping === null ? [] : [{ package_id: 0, name: "Delivery", shipping_rates: [ { ...currency, rate_id: "flat_rate:1", name: "Home delivery", price: "6000", selected: session.rate !== "express:2" }, { ...currency, rate_id: "express:2", name: "Express delivery", price: "10000", selected: session.rate === "express:2" } ] }],
  };
}
const backend = http.createServer(async (req, res) => {
  try {
    assert.equal(req.headers.cookie, undefined, "Frontend cookies must never be forwarded to WordPress");
    assert.equal(req.headers.authorization, undefined);
    const u = new URL(req.url, "http://fixture");
    const path = u.pathname.replace("/wp-json/wc/store/v1", "");
    const send = (data, status = 200) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(data)); };
    if (path === "/products" && u.searchParams.get("type") === "variation") {
      res.setHeader("X-WP-TotalPages", "1");
      return send([{ id: 7785, parent: 7784, type: "variation", variation: "Size: Small", permalink: "https://fixture/product/cream?attribute_size=Small", is_in_stock: true, is_purchasable: true, prices: { ...currency, price: "1500" } }]);
    }
    if (!path.startsWith("/cart") && !path.startsWith("/checkout") && !path.startsWith("/order/")) return send([]);
    if (unavailable) return send({ message: "Store unavailable", code: "temporary_error" }, 503);
    let session = sessions.get(req.headers["cart-token"]);
    if (!session) {
      if (req.method !== "GET" || path !== "/cart" || req.headers["cart-token"]) return send({ message: "Invalid token" }, 401);
      session = { items: [], billing: { ...blank }, shipping: { ...blank }, rate: "flat_rate:1", coupon: false };
    }
    res.setHeader("Cart-Token", token(session)); // Deliberately rotate every response.
    let body = {};
    if (req.method === "POST") { let raw = ""; for await (const chunk of req) raw += chunk; body = JSON.parse(raw); }
    if (path === "/cart") return send(cart(session));
    if (path.startsWith("/cart/")) {
      counters.mutations++;
      switch (path) {
        case "/cart/add-item": {
          assert.equal(body.id, 7785); assert.deepEqual(body.variation, [{ attribute: "attribute_size", value: "Small" }]);
          const existing = session.items[0];
          if (existing) existing.quantity += body.quantity; else session.items.push({ key: "item-key", id: body.id, quantity: body.quantity });
          break;
        }
        case "/cart/update-item": assert.equal(body.key, "item-key"); session.items[0].quantity = body.quantity; break;
        case "/cart/remove-item": session.items = []; break;
        case "/cart/apply-coupon": if (body.code !== "SAVE10") return send({ message: "Invalid coupon", code: "invalid_coupon" }, 400); session.coupon = true; break;
        case "/cart/remove-coupon": session.coupon = false; break;
        case "/cart/update-customer": session.billing = body.billing_address; session.shipping = body.shipping_address; break;
        case "/cart/select-shipping-rate": assert.equal(body.package_id, 0); session.rate = body.rate_id; break;
        default: return send({ message: "Unknown action" }, 404);
      }
      return send(cart(session));
    }
    if (path.startsWith("/order/")) {
      const order = orders.get(Number(path.split("/").pop()));
      if (!order || u.searchParams.get("key") !== order.key || u.searchParams.get("billing_email") !== order.email) return send({ message: "No order" }, 403);
      return send({ ...order.snapshot, id: order.id, number: String(order.id), status: order.status });
    }
    if (path === "/checkout") {
      if (req.method === "GET") {
        if (!session.order || session.order.status !== "checkout-draft") {
          const id = orders.size + 1000;
          session.order = { id, key: `wc_order_fixture_${id}`, status: "checkout-draft", email: session.billing.email, snapshot: structuredClone(cart(session)) };
          orders.set(id, session.order);
        }
        return send({ order_id: session.order.id, order_key: session.order.key, status: session.order.status });
      }
      assert.equal(body.payment_method, "cod"); assert.equal(body.expected_total, cart(session).totals.total_price); assert.equal(body.create_account, false);
      assert.equal(body.billing_address.email, session.billing.email);
      await new Promise((resolve) => setTimeout(resolve, 50));
      submitted++;
      session.order.status = "processing";
      session.order.snapshot = structuredClone(cart(session));
      session.items = [];
      if (dropAfterOrder) { dropAfterOrder = false; req.socket.destroy(); return; }
      return send({ order_id: session.order.id, order_key: session.order.key, status: "processing", payment_result: { payment_status: "success" } });
    }
    send({ message: "Unknown route" }, 404);
  } catch (error) { console.error("Fixture failure:", error); res.writeHead(500); res.end(JSON.stringify({ message: error.message })); }
});
await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
const upstream = `http://127.0.0.1:${backend.address().port}`;
const port = Number(process.env.COMMERCE_TEST_PORT || 3215);
const base = `http://127.0.0.1:${port}`;
const origin = process.env.COMMERCE_TEST_ORIGIN || base;
const production = process.env.COMMERCE_TEST_PRODUCTION === "1";
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", production ? "start" : "dev", ...(production ? [] : ["--webpack"]), "-p", String(port), "-H", "127.0.0.1"], {
  env: { ...process.env, WORDPRESS_URL: upstream, NEXT_PUBLIC_SITE_URL: origin, COMMERCE_SESSION_SECRET: randomBytes(32).toString("hex"), NEXT_TELEMETRY_DISABLED: "1" }, stdio: ["ignore", "pipe", "pipe"],
});
let logs = "";
server.stdout.on("data", (b) => logs += b); server.stderr.on("data", (b) => logs += b);
class Browser {
  cookies = new Map();
  async request(path, body, options = {}) {
    const headers = { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...(body === undefined ? {} : { Origin: origin, "Content-Type": "application/json" }), ...options.headers };
    const res = await fetch(base + path, { method: body === undefined ? "GET" : "POST", headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
    for (const cookie of res.headers.getSetCookie()) { const [key, ...parts] = cookie.split(";")[0].split("="); if (parts.join("=")) this.cookies.set(key, parts.join("=")); else this.cookies.delete(key); }
    const data = await res.json().catch(() => null);
    return { res, data };
  }
  cart() { return this.request("/api/commerce/cart"); }
  change(action, data = {}) { return this.request("/api/commerce/cart", { action, data }); }
  checkout(body) { return this.request("/api/commerce/checkout", body); }
}
const fullAddress = { ...blank, first_name: "Test", last_name: "Customer", email: "test@example.invalid", phone: "01700000000", address_1: "Test address", city: "Dhaka", state: "BD-13" };
function ok(result) { assert.equal(result.res.status, 200, JSON.stringify(result.data)); return result.data; }
async function ready(browser) {
  ok(await browser.change("add-item", { id: 7784, variation: 7785, quantity: 2 }));
  return ok(await browser.change("update-customer", { billing_address: fullAddress, shipping_address: fullAddress }));
}
try {
  for (let i = 0; i < 150; i++) {
    try { const r = await fetch(base + "/api/commerce/cart"); if (r.status === 200) break; } catch {}
    if (i === 149) throw new Error("Next.js did not start");
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const a = new Browser(), b = new Browser();
  const initial = await a.cart();
  assert.equal(ok(initial).items_count, 0);
  assert(initial.res.headers.get("cache-control").includes("no-store"));
  assert(initial.res.headers.get("set-cookie").includes("HttpOnly"));
  if (origin.startsWith("https:")) assert(initial.res.headers.get("set-cookie").includes("Secure"));
  assert(!initial.res.headers.get("set-cookie").includes("Domain="));
  assert(!initial.res.headers.get("set-cookie").includes("fixture-"));
  assert.equal(initial.res.headers.get("cart-token"), null);
  console.log("PASS private encrypted cookie, no upstream token exposure, no shared cache");

  for (const input of [ { id: 7784, quantity: 0 }, { id: "7784", quantity: 1 }, { id: 7784, quantity: 1.5 }, { id: 7784, variation: 9999, quantity: 1 } ]) assert.equal((await a.change("add-item", input)).res.status, 400);
  assert.equal((await a.request("/api/commerce/cart", { action: "remove-item", data: { key: "x" } }, { headers: { Origin: "https://attacker.invalid" } })).res.status, 403);
  assert.equal((await a.change("unknown", {})).res.status, 400);
  console.log("PASS cross-origin requests, unknown operations and invalid product/quantity rejected");

  assert.equal(ok(await a.change("add-item", { id: 7784, variation: 7785, quantity: 2, price: 1 })).items_count, 2);
  assert.equal(ok(await b.cart()).items_count, 0);
  const corrupt = new Browser(); corrupt.cookies.set("saversbd_shop_session", a.cookies.get("saversbd_shop_session").slice(0, -8) + "tampered");
  assert.equal((await corrupt.cart()).res.status, 409);
  console.log("PASS variant attributes, two-customer session isolation and tamper rejection");

  let current = ok(await a.change("update-item", { key: "item-key", quantity: 3 })); assert.equal(current.totals.total_items, "4500");
  current = ok(await a.change("apply-coupon", { code: "SAVE10" })); assert.equal(current.totals.total_discount, "450");
  assert.equal((await a.change("apply-coupon", { code: "INVALID" })).res.status, 400);
  ok(await a.change("remove-coupon", { code: "SAVE10" }));
  assert.equal((await a.checkout({ action: "prepare-order", expected_total: "4500" })).res.status, 400);
  current = ok(await a.change("update-customer", { billing_address: fullAddress, shipping_address: fullAddress }));
  current = ok(await a.change("select-shipping-rate", { package_id: 0, rate_id: "express:2" })); assert.equal(current.totals.total_shipping, "10000");
  console.log("PASS quantity, coupons, address validation and backend-calculated shipping");

  const total = current.totals.total_price;
  assert.equal((await a.checkout({ action: "prepare-order", expected_total: "1" })).res.status, 409);
  ok(await a.checkout({ action: "prepare-order", expected_total: total }));
  const receiptCookie = a.cookies.get("saversbd_shop_order"); assert(!receiptCookie.includes("wc_order_"));
  b.cookies.set("saversbd_shop_order", receiptCookie); assert.equal((await b.request("/api/commerce/checkout")).res.status, 404);
  assert.equal((await a.checkout({ action: "place-order", expected_total: total, confirmed: false })).res.status, 400);
  const changed = ok(await a.change("update-item", { key: "item-key", quantity: 2 }));
  a.cookies.set("saversbd_shop_order", receiptCookie);
  assert.equal((await a.checkout({ action: "place-order", expected_total: changed.totals.total_price, confirmed: true })).res.status, 409);
  console.log("PASS total review, explicit confirmation, receipt isolation and changed-cart rejection");

  ok(await a.checkout({ action: "prepare-order", expected_total: changed.totals.total_price }));
  const orderBody = { action: "place-order", expected_total: changed.totals.total_price, confirmed: true, customer_note: "Fixture only" };
  const concurrent = await Promise.all([a.checkout(orderBody), a.checkout(orderBody)]);
  assert(concurrent.some((r) => r.res.status === 200)); assert.equal(submitted, 1);
  assert(ok(await a.checkout(orderBody)).received); assert.equal(submitted, 1);
  const confirmation = ok(await a.request("/api/commerce/checkout")); assert.equal(confirmation.received, true); assert.equal(confirmation.items[0].quantity, 2);
  assert(!JSON.stringify(confirmation).includes("test@example.invalid"));
  console.log("PASS COD order, duplicate-submit prevention, private confirmation and no payment redirect");

  const c = new Browser(); current = await ready(c);
  ok(await c.checkout({ action: "prepare-order", expected_total: current.totals.total_price }));
  dropAfterOrder = true;
  const uncertain = await c.checkout({ action: "place-order", expected_total: current.totals.total_price, confirmed: true });
  assert.equal(uncertain.data.code, "check_order_status");
  assert.equal(submitted, 2);
  assert(ok(await c.request("/api/commerce/checkout")).received);
  assert(ok(await c.checkout({ action: "place-order", expected_total: current.totals.total_price, confirmed: true })).received);
  assert.equal(submitted, 2);
  console.log("PASS lost order response recovered without duplicate order");

  const d = new Browser(); current = await ready(d);
  current = ok(await d.change("update-customer", { billing_address: fullAddress, shipping_address: { ...fullAddress, state: "BD-64" } }));
  assert.equal((await d.checkout({ action: "prepare-order", expected_total: current.totals.total_price })).res.status, 400);
  unavailable = true; assert.equal((await d.cart()).res.status, 502); unavailable = false;
  ok(await d.change("remove-item", { key: "item-key" })); assert.equal(ok(await d.cart()).items_count, 0);
  await d.change("reset-session"); assert.equal(ok(await d.cart()).items_count, 0);
  const before = counters.mutations; const legacy = await fetch(base + "/api/cart/add?id=7784", { redirect: "manual" }); assert.equal(legacy.status, 302); assert.equal(counters.mutations, before);
  console.log("PASS unavailable COD, upstream failure, remove/reset cart and safe legacy GET");
  console.log("All commerce integration checks passed. No real store orders were created.");
} catch (error) { console.error(error); console.error(logs.slice(-6000)); process.exitCode = 1; }
finally { server.kill("SIGTERM"); await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 3000))]); backend.closeAllConnections(); backend.close(); }
