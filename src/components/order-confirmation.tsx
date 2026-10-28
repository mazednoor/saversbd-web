"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { shopRequest, loadCart } from "@/lib/commerce-client";
import { money, type OrderReceipt } from "@/lib/commerce-types";
import { decodeEntities } from "@/lib/format";

export function OrderConfirmation() {
  const [order, setOrder] = useState<(OrderReceipt & { received: boolean }) | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { shopRequest<OrderReceipt & { received: boolean }>("/api/commerce/checkout").then((data) => { setOrder(data); void loadCart().catch(() => undefined); }).catch((e) => setError(e.message)); }, []);
  return <main className="container-page py-12"><div className="mx-auto max-w-2xl rounded-2xl border border-line bg-white p-6 sm:p-9">
    {!order && !error && <p role="status">Checking your order…</p>}
    {error && <div role="alert"><h1 className="text-2xl font-bold">Unable to load this order</h1><p className="mt-3 text-muted">{error}</p><Link href="/contact" className="btn btn-primary mt-5">Contact us</Link></div>}
    {order && <><p className="text-xs font-bold uppercase tracking-widest text-brand">SaversBD</p><h1 className="mt-3 text-3xl font-bold">{order.received ? "Thank you! Order received." : "Your order status"}</h1><p className="mt-3 text-muted">Order #{order.number} · {order.status.replaceAll("-", " ")}</p>
      <p className="mt-4 rounded-xl bg-haze p-4 text-sm">{order.received ? "This is a cash-on-delivery order. Payment is due when your order arrives." : "Your order is not confirmed yet. Please contact us before placing another order."}</p>
      <ul className="mt-6 divide-y divide-line">{order.items.map((item, i) => <li key={item.key || i} className="flex gap-4 py-3 text-sm"><span className="flex-1">{decodeEntities(item.name)} × {item.quantity}</span><strong>{money(item.totals.line_total, item.totals)}</strong></li>)}</ul>
      <div className="mt-4 flex justify-between border-t border-line pt-5 text-lg font-bold"><span>Total</span><span>{money(order.totals.total_price, order.totals)}</span></div>
      <div className="mt-7 flex flex-wrap gap-3"><Link href="/shop" className="btn btn-primary">Continue shopping</Link><Link href="/contact" className="btn btn-ink">Need help?</Link></div></>}
  </div></main>;
}
