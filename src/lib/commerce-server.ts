import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { SITE_URL, WP_URL } from "./site";
import type { Address, StoreCart } from "./commerce-types";

export const CART_COOKIE = "saversbd_shop_session";
export const ORDER_COOKIE = "saversbd_shop_order";
export const PRIVATE_HEADERS = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Robots-Tag": "noindex" };
const COOKIE_TTL = 60 * 60 * 24 * 2;

export class CommerceError extends Error {
  constructor(message: string, public status = 400, public code = "commerce_error") { super(message); }
}
function encryptionKey() {
  const secret = process.env.COMMERCE_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new CommerceError("Shopping is temporarily unavailable. Please contact the store.", 503, "session_not_configured");
  return createHash("sha256").update(secret).digest();
}
export function seal(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify({ value, exp: Date.now() + COOKIE_TTL * 1000 })), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}
export function unseal<T>(value: string | undefined): T | undefined {
  if (!value) return undefined;
  try {
    const raw = Buffer.from(value, "base64url");
    const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), raw.subarray(0, 12));
    cipher.setAuthTag(raw.subarray(12, 28));
    const payload = JSON.parse(Buffer.concat([cipher.update(raw.subarray(28)), cipher.final()]).toString());
    return payload.exp > Date.now() ? payload.value as T : undefined;
  } catch { return undefined; }
}
export function setPrivateCookie(response: NextResponse, name: string, value: unknown) {
  response.cookies.set(name, seal(value), {
    httpOnly: true, secure: new URL(SITE_URL).protocol === "https:", sameSite: "lax", path: "/", maxAge: COOKIE_TTL,
  });
}
export function fail(error: unknown) {
  const known = error instanceof CommerceError;
  return NextResponse.json({ message: known ? error.message : "The store could not respond. Please try again.", code: known ? error.code : "upstream_unavailable" },
    { status: known ? error.status : 503, headers: PRIVATE_HEADERS });
}
export function requireSameOrigin(request: NextRequest) {
  if (request.headers.get("origin") !== new URL(SITE_URL).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new CommerceError("This request is not allowed.", 403, "invalid_origin");
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new CommerceError("Use a JSON request.", 415);
}
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CommerceError("Invalid request.");
  return value as Record<string, unknown>;
}
export async function readBody(request: NextRequest) {
  if (Number(request.headers.get("content-length")) > 16_384) throw new CommerceError("Request is too large.", 413);
  const text = await request.text();
  if (text.length > 16_384) throw new CommerceError("Request is too large.", 413);
  try { return record(JSON.parse(text)); } catch { throw new CommerceError("Invalid request."); }
}
export function text(value: unknown, max = 200): string {
  if (typeof value !== "string" || value.length > max) throw new CommerceError("Invalid field value.");
  return value.trim();
}
export function integer(value: unknown, min = 1, max = Number.MAX_SAFE_INTEGER) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) throw new CommerceError("Invalid quantity or product.");
  return value;
}
export function address(value: unknown): Address {
  const input = record(value);
  const result: Address = { first_name: "", last_name: "", company: "", address_1: "", address_2: "", city: "", state: "", postcode: "", country: "BD" };
  for (const key of Object.keys(result) as (keyof Address)[]) result[key] = text(input[key] ?? "", key === "address_1" || key === "address_2" ? 300 : 100);
  if (result.country !== "BD") throw new CommerceError("Delivery is currently available within Bangladesh.");
  if (input.email !== undefined) result.email = text(input.email, 254);
  if (input.phone !== undefined) result.phone = text(input.phone, 40);
  return result;
}

export async function storeRequest<T>(path: string, token?: string, body?: unknown, timeout = 20_000): Promise<{ data: T; token?: string }> {
  const headers: Record<string, string> = { Accept: "application/json", "Cache-Control": "no-cache" };
  if (token) headers["Cart-Token"] = token;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const result = await fetch(`${WP_URL}/wp-json/wc/store/v1${path}`, {
    method: body === undefined ? "GET" : "POST", headers,
    body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", redirect: "error", signal: AbortSignal.timeout(timeout),
  });
  const data = await result.json().catch(() => null);
  if (!result.ok) {
    const message = typeof data?.message === "string" ? data.message.replace(/<[^>]*>/g, "").slice(0, 500) : "The store could not process this request.";
    throw new CommerceError(message, result.status >= 400 && result.status < 500 ? result.status : 502, data?.code ?? "upstream_error");
  }
  if (!data || typeof data !== "object") throw new CommerceError("The store returned an invalid response.", 502);
  return { data, token: result.headers.get("Cart-Token") ?? token };
}
export function sessionToken(request: NextRequest) {
  return unseal<{ token: string }>(request.cookies.get(CART_COOKIE)?.value)?.token;
}
export async function cartSession(request: NextRequest) {
  encryptionKey();
  const cookie = request.cookies.get(CART_COOKIE)?.value;
  const token = sessionToken(request);
  if (cookie && !token) throw new CommerceError("Your shopping session expired. Start a new cart to continue.", 409, "session_expired");
  try {
    const result = await storeRequest<StoreCart>("/cart", token);
    if (!result.token) throw new CommerceError("The store did not create a shopping session.", 502);
    // Keep the existing valid token stable while preparing/checking an order.
    // WooCommerce may issue a newly signed token on otherwise read-only requests.
    return { cart: result.data, token: token ?? result.token };
  } catch (error) {
    if (token && error instanceof CommerceError && [401, 403].includes(error.status)) {
      throw new CommerceError("Your shopping session expired. Start a new cart to continue.", 409, "session_expired");
    }
    throw error;
  }
}
export function cartResponse(cart: StoreCart, token: string) {
  const response = NextResponse.json(cart, { headers: PRIVATE_HEADERS });
  setPrivateCookie(response, CART_COOKIE, { token });
  return response;
}
export function cartSignature(cart: StoreCart) {
  return createHash("sha256").update(JSON.stringify({ items: cart.items.map((i) => [i.key, i.quantity]), total: cart.totals.total_price,
    billing: cart.billing_address, shipping: cart.shipping_address, rates: cart.shipping_rates.map((p) => p.shipping_rates.filter((r) => r.selected).map((r) => r.rate_id)) })).digest("hex");
}

// Serializes mutations of the same cart within the single Next.js process on this VPS.
const pending = new Map<string, Promise<unknown>>();
export async function exclusive<T>(token: string, operation: () => Promise<T>): Promise<T> {
  const key = createHash("sha256").update(token).digest("hex");
  if (pending.has(key)) throw new CommerceError("Another cart update is in progress. Please wait.", 409, "cart_busy");
  const promise = operation();
  pending.set(key, promise);
  try { return await promise; } finally { pending.delete(key); }
}
