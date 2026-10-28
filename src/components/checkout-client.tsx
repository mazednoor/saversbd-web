"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BD_DISTRICTS } from "@/lib/bd-districts";
import { ShopError, shopRequest, useCart } from "@/lib/commerce-client";
import { money, type Address } from "@/lib/commerce-types";
import { decodeEntities } from "@/lib/format";
import { CartProblems, CartSummary } from "./cart-summary";

const emptyAddress: Address = { first_name: "", last_name: "", company: "", address_1: "", address_2: "", city: "", state: "", postcode: "", country: "BD", email: "", phone: "" };
const inputClass = "mt-1.5 h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink focus:outline-brand";
function AddressFields({ prefix, value, change, contact = false }: { prefix: string; value: Address; change: (value: Address) => void; contact?: boolean }) {
  const fields: { key: keyof Address; label: string; required?: boolean; type?: string; autoComplete?: string; span?: boolean }[] = [
    { key: "first_name", label: "First name", required: true, autoComplete: "given-name" },
    { key: "last_name", label: "Last name", required: true, autoComplete: "family-name" },
    ...(contact ? [ { key: "phone" as const, label: "Phone number", type: "tel", required: true, autoComplete: "tel" }, { key: "email" as const, label: "Email address", type: "email", required: true, autoComplete: "email" } ] : []),
    { key: "address_1", label: "House, road and area", required: true, autoComplete: "address-line1", span: true },
    { key: "address_2", label: "Apartment or delivery landmark (optional)", autoComplete: "address-line2", span: true },
    { key: "city", label: "City / town", required: true, autoComplete: "address-level2" },
    { key: "postcode", label: "Postcode (optional)", autoComplete: "postal-code" },
  ];
  return <div className="grid gap-4 sm:grid-cols-2">
    {fields.map((f) => <label key={f.key} htmlFor={`${prefix}-${f.key}`} className={`text-sm font-medium text-ink ${f.span ? "sm:col-span-2" : ""}`}>{f.label}{f.required ? " *" : ""}<input id={`${prefix}-${f.key}`} name={`${prefix}-${f.key}`} type={f.type || "text"} required={f.required} value={value[f.key] ?? ""} onChange={(e) => change({ ...value, [f.key]: e.target.value })} autoComplete={`${prefix} ${f.autoComplete || "off"}`} maxLength={f.key === "address_1" || f.key === "address_2" ? 300 : f.key === "email" ? 254 : 100} className={inputClass} /></label>)}
    <label htmlFor={`${prefix}-state`} className="text-sm font-medium text-ink">District *<select id={`${prefix}-state`} name={`${prefix}-state`} value={value.state} required onChange={(e) => change({ ...value, state: e.target.value })} autoComplete={`${prefix} address-level1`} className={inputClass}><option value="">Select your district</option>{Object.entries(BD_DISTRICTS).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
    <div className="text-sm font-medium text-ink">Country<div className={`${inputClass} flex items-center bg-haze`}>Bangladesh</div></div>
  </div>;
}

export function CheckoutClient() {
  const { cart, error: cartError, busy: cartBusy, change, load } = useCart();
  const [billing, setBilling] = useState<Address>({ ...emptyAddress });
  const [shipping, setShipping] = useState<Address>({ ...emptyAddress });
  const [different, setDifferent] = useState(false);
  const [confirmedAddress, setConfirmedAddress] = useState("");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [error, setError] = useState<ShopError | null>(null);
  const hydrated = useRef(false);
  const lock = useRef(false);
  const addressSnapshot = JSON.stringify({ billing, shipping: different ? shipping : billing });
  const addressReady = confirmedAddress === addressSnapshot;
  const selectedShipping = !cart?.needs_shipping || Boolean(cart.shipping_rates.length && cart.shipping_rates.every((p) => p.shipping_rates.some((r) => r.selected)));
  const cod = cart?.payment_methods.includes("cod");
  const busy = ordering || cartBusy;

  useEffect(() => {
    if (!cart || hydrated.current) return;
    hydrated.current = true;
    const b = { ...emptyAddress, ...cart.billing_address, country: "BD" };
    const s = { ...emptyAddress, ...cart.shipping_address, country: "BD" };
    setBilling(b); setShipping(s);
  }, [cart]);

  async function updateAddress(event: FormEvent) {
    event.preventDefault(); setError(null); setConfirmed(false);
    const result = await change("update-customer", { billing_address: billing, shipping_address: different ? shipping : billing });
    if (result) setConfirmedAddress(addressSnapshot);
  }
  async function checkStatus() {
    setOrdering(true);
    try {
      const result = await shopRequest<{ received: boolean; status: string }>("/api/commerce/checkout");
      if (result.received) { window.location.assign("/order-confirmation"); return; }
      if (result.status === "checkout-draft") {
        setUncertain(false); setError(new ShopError("The store has not received a completed order. Review your details before placing it again."));
      } else setError(new ShopError("Your order status is " + result.status + ". Please contact us before placing another order.", "check_order_status"));
    } catch (e) { setError(e instanceof ShopError ? e : new ShopError("Unable to check order status.")); }
    finally { setOrdering(false); }
  }
  async function placeOrder() {
    if (!cart || lock.current || !confirmed || !addressReady || !selectedShipping || !cod) return;
    lock.current = true; setOrdering(true); setError(null);
    let submitting = false;
    try {
      const prepared = await shopRequest<{ prepared?: boolean; received?: boolean }>("/api/commerce/checkout", { action: "prepare-order", expected_total: cart.totals.total_price });
      if (prepared.received) { window.location.assign("/order-confirmation"); return; }
      submitting = true;
      await shopRequest("/api/commerce/checkout", { action: "place-order", confirmed, expected_total: cart.totals.total_price, customer_note: note });
      window.location.assign("/order-confirmation");
    } catch (e) {
      const failure = e instanceof ShopError ? e : new ShopError("Unable to place this order.");
      setError(failure);
      if (failure.code === "check_order_status" || submitting && failure.code === "connection_interrupted") setUncertain(true);
      if (failure.code === "cart_changed") { setConfirmed(false); setConfirmedAddress(""); await load(); }
    } finally { lock.current = false; setOrdering(false); }
  }
  return <main className="container-page py-8 md:py-12">
    <p className="text-sm text-muted"><Link href="/cart">Cart</Link> / Checkout</p>
    <h1 className="mt-5 text-3xl font-bold text-ink md:text-4xl">Checkout</h1><p className="mt-2 text-sm text-muted">Delivery details, a final review, and you’re done.</p>
    {(error || cartError) && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"><p>{(error || cartError)?.message}</p>{uncertain ? <button disabled={busy} onClick={() => void checkStatus()} className="mt-3 underline disabled:opacity-40">Check order status</button> : <button disabled={busy} onClick={() => void load()} className="mt-3 underline disabled:opacity-40">Refresh cart</button>}<Link href="/contact" className="ml-4 underline">Contact us</Link></div>}
    {!cart && !cartError && <p role="status" className="mt-8 text-muted">Loading your checkout…</p>}
    {cart && !cart.items.length && <div className="mt-8 rounded-2xl border border-line p-8"><h2 className="text-xl font-bold">Your cart is empty</h2><p className="mt-2 text-muted">Add a product before checking out.</p><Link href="/shop" className="btn btn-primary mt-5">Continue shopping</Link></div>}
    {cart && cart.items.length > 0 && <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="space-y-6"><CartProblems cart={cart} />
        <form onSubmit={(e) => void updateAddress(e)} className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <fieldset disabled={busy || uncertain}><legend className="mb-5 text-lg font-bold">1. Contact & delivery</legend>
            <AddressFields prefix="billing" value={billing} change={setBilling} contact />
            <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={different} onChange={(e) => setDifferent(e.target.checked)} className="size-4 accent-brand" />Ship to a different address</label>
            {different && <div className="mt-5"><h3 className="mb-4 font-semibold">Shipping address</h3><AddressFields prefix="shipping" value={shipping} change={setShipping} /></div>}
            <button className="btn btn-ink mt-5 h-12 w-full disabled:opacity-40 sm:w-auto" disabled={busy}>{cartBusy ? "Updating delivery…" : "Update delivery & total"}</button>
          </fieldset>
        </form>
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6" aria-busy={cartBusy}><h2 className="text-lg font-bold">2. Delivery method</h2>
          {!addressReady ? <p className="mt-3 text-sm text-muted">Enter your details and update delivery to see available methods.</p>
            : !cart.needs_shipping ? <p className="mt-3 text-sm text-muted">No shipping is required for these items.</p>
            : cart.shipping_rates.length === 0 || cart.shipping_rates.some((p) => !p.shipping_rates.length) ? <p role="alert" className="mt-3 text-sm text-brand">No delivery method is available for this address. Check your district and postcode or contact us.</p>
            : cart.shipping_rates.map((p) => <fieldset disabled={busy || uncertain} key={p.package_id} className="mt-4 space-y-2"><legend className="mb-2 text-sm text-muted">{decodeEntities(p.name || "Delivery")}</legend>{p.shipping_rates.map((r) => <label key={r.rate_id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm ${r.selected ? "border-brand bg-brand-soft/40" : "border-line"}`}><input type="radio" name={`shipping-${p.package_id}`} checked={r.selected} onChange={() => { setConfirmed(false); void change("select-shipping-rate", { package_id: p.package_id, rate_id: r.rate_id }); }} className="accent-brand" /><span className="flex-1">{decodeEntities(r.name)}</span><strong>{money(r.price, r)}</strong></label>)}</fieldset>)}
        </section>
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6"><h2 className="text-lg font-bold">3. Payment</h2>
          <div className="mt-4 rounded-xl border border-line bg-haze p-4"><p className="font-semibold">Cash on delivery</p><p className="mt-1 text-sm text-muted">Pay when your order arrives.</p></div>
          {addressReady && !cod && <p role="alert" className="mt-3 text-sm text-brand">Cash on delivery is not available for the selected delivery method. Choose another delivery method or contact us.</p>}
          <label htmlFor="order-note" className="mt-5 block text-sm font-medium">Order note (optional)<textarea id="order-note" value={note} onChange={(e) => setNote(e.target.value)} disabled={busy || uncertain} maxLength={1000} rows={3} className="mt-2 w-full rounded-xl border border-line p-3 text-base" placeholder="Anything we should know about your delivery?" /></label>
        </section>
      </div>
      <div className="space-y-4 lg:sticky lg:top-32">
        <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-bold">Your items</h2><ul className="mt-3 divide-y divide-line">{cart.items.map((i) => <li key={i.key} className="py-3 text-sm"><div className="flex gap-3"><span className="flex-1">{decodeEntities(i.name)} × {i.quantity}</span><strong>{money(i.totals.line_total, i.totals)}</strong></div>{i.variation.map((v) => <p key={v.attribute} className="mt-1 text-xs text-muted">{decodeEntities(v.attribute)}: {decodeEntities(v.value)}</p>)}</li>)}</ul><Link href="/cart" className="mt-3 inline-block text-sm text-brand underline">Edit cart</Link></section>
        <CartSummary cart={cart}>
          <label className="mt-5 flex items-start gap-3 text-sm leading-relaxed"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={busy || uncertain || !addressReady} className="mt-1 size-4 shrink-0 accent-brand" /><span>I confirm my delivery details and want to place this cash-on-delivery order.</span></label>
          <button type="button" onClick={() => void placeOrder()} disabled={busy || uncertain || !confirmed || !addressReady || !selectedShipping || !cod || Boolean(cart.errors?.length)} className="btn btn-primary mt-5 h-12 w-full disabled:cursor-not-allowed disabled:opacity-40">{ordering ? "Placing your order…" : `Place order · ${money(cart.totals.total_price, cart.totals)}`}</button>
          {!addressReady && <p className="mt-3 text-xs text-muted">Update delivery and review the total before placing your order.</p>}
        </CartSummary>
      </div>
    </div>}
  </main>;
}
