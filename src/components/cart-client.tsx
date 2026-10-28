"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart, resetCart } from "@/lib/commerce-client";
import { money } from "@/lib/commerce-types";
import { decodeEntities } from "@/lib/format";
import { CartProblems, CartSummary } from "./cart-summary";

export function CartClient() {
  const { cart, busy, error, change, load } = useCart();
  const [coupon, setCoupon] = useState("");
  return <main className="container-page py-8 md:py-12">
    <p className="text-sm text-muted"><Link href="/">Home</Link> / Cart</p>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Your shopping bag</p><h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">Your cart</h1><p className="mt-2 text-sm text-muted">Review your items before checkout.</p></div><Link href="/shop" className="text-sm font-semibold underline underline-offset-4">Continue shopping</Link></div>
    {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-800"><p>{error.message}</p><button className="mt-2 underline" onClick={() => void load()}>Refresh cart</button>{error.code === "session_expired" && <button className="ml-4 underline" onClick={() => void resetCart().catch(() => undefined)}>Start a new empty cart</button>}</div>}
    {!cart && !error && <p className="mt-8 text-muted" role="status">Loading your cart…</p>}
    {cart && !cart.items.length && <div className="mt-8 rounded-2xl border border-line bg-haze p-8 text-center"><h2 className="text-xl font-bold">Your cart is empty</h2><p className="mt-2 text-sm text-muted">Find something you love and add it to your bag.</p><Link href="/shop" className="btn btn-primary mt-5">Explore the shop</Link></div>}
    {cart && cart.items.length > 0 && <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
      <section aria-label="Cart items" className="overflow-hidden rounded-2xl border border-line bg-white" aria-busy={busy}>
        <div className="flex justify-between border-b border-line p-5"><h2 className="font-bold">Cart items</h2><span className="text-sm text-muted">{cart.items_count} items</span></div>
        <div className="p-3"><CartProblems cart={cart} /></div>
        {cart.items.map((item) => <article key={item.key} className="flex gap-4 border-b border-line p-4 sm:gap-5 sm:p-5">
          {item.images[0] && <img src={item.images[0].thumbnail || item.images[0].src} alt="" className="size-20 shrink-0 rounded-xl bg-haze object-contain p-2 sm:size-28" />}
          <div className="min-w-0 flex-1"><h3 className="font-semibold leading-snug text-ink">{decodeEntities(item.name)}</h3>
            {item.variation.map((v) => <p key={v.attribute} className="mt-1 text-sm text-muted">{decodeEntities(v.attribute)}: {decodeEntities(v.value)}</p>)}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex h-10 items-center rounded-full border border-line"><button type="button" disabled={busy || !item.quantity_limits.editable || item.quantity - item.quantity_limits.multiple_of < item.quantity_limits.minimum} onClick={() => void change("update-item", { key: item.key, quantity: item.quantity - item.quantity_limits.multiple_of })} className="size-10 rounded-full disabled:opacity-30" aria-label={`Decrease quantity of ${decodeEntities(item.name)}`}>−</button><span className="w-8 text-center text-sm font-semibold" aria-live="polite">{item.quantity}</span><button type="button" disabled={busy || !item.quantity_limits.editable || item.quantity + item.quantity_limits.multiple_of > item.quantity_limits.maximum} onClick={() => void change("update-item", { key: item.key, quantity: item.quantity + item.quantity_limits.multiple_of })} className="size-10 rounded-full disabled:opacity-30" aria-label={`Increase quantity of ${decodeEntities(item.name)}`}>+</button></div>
              <strong className="text-ink">{money(item.totals.line_total, item.totals)}</strong>
            </div><button type="button" disabled={busy} onClick={() => void change("remove-item", { key: item.key })} className="mt-3 text-sm text-muted underline hover:text-brand disabled:opacity-40">Remove</button>
          </div>
        </article>)}
        <form className="bg-haze/40 p-5" onSubmit={async (e) => { e.preventDefault(); if (await change("apply-coupon", { code: coupon.trim() })) setCoupon(""); }}>
          <label htmlFor="coupon" className="text-sm font-semibold">Have a coupon?</label><div className="mt-2 flex gap-2"><input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Enter coupon code" maxLength={100} className="h-11 min-w-0 flex-1 rounded-lg border border-line bg-white px-3" /><button disabled={busy || !coupon.trim()} className="rounded-lg border border-line px-4 text-sm font-semibold disabled:opacity-40">Apply</button></div>
          {cart.coupons.map((c) => <button type="button" key={c.code} disabled={busy} onClick={() => void change("remove-coupon", { code: c.code })} className="mr-3 mt-3 text-sm text-brand underline">Remove {decodeEntities(c.code)}</button>)}
        </form>
      </section>
      <CartSummary cart={cart}><Link href="/checkout" className="btn btn-primary mt-5 h-12 w-full">Proceed to checkout</Link><p className="mt-3 text-center text-xs text-muted">Cash on delivery available for eligible orders.</p></CartSummary>
    </div>}
  </main>;
}
