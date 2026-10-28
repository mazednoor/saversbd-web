import { decodeEntities } from "@/lib/format";
import { money, type StoreCart } from "@/lib/commerce-types";
import type { ReactNode } from "react";

export function CartSummary({ cart, children }: { cart: StoreCart; children?: ReactNode }) {
  const t = cart.totals;
  const rows: [string, string][] = [
    ["Subtotal", money(t.total_items, t)],
    ...(Number(t.total_discount) ? [["Discount", `−${money(t.total_discount, t)}`] as [string, string]] : []),
    ["Delivery", cart.needs_shipping && t.total_shipping === null ? "Enter delivery details" : money(t.total_shipping ?? "0", t)],
    ...(Number(t.total_fees) ? [["Fees", money(t.total_fees, t)] as [string, string]] : []),
    ...(Number(t.total_tax) ? [["Tax", money(t.total_tax, t)] as [string, string]] : []),
  ];
  return <aside className="rounded-2xl border border-line bg-white p-5 shadow-[0_14px_40px_-30px_rgba(4,0,55,.35)] sm:p-6">
    <h2 className="text-lg font-bold text-ink">Order summary</h2>
    <dl className="mt-5 space-y-4 text-sm">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-muted">{label}</dt><dd className="text-right font-medium text-ink">{value}</dd></div>)}</dl>
    <div className="mt-5 flex justify-between gap-4 border-t border-line pt-5"><span className="font-bold">Total</span><strong className="text-xl text-ink">{money(t.total_price, t)}</strong></div>
    {children}
    <p className="mt-4 text-xs leading-relaxed text-muted">{cart.needs_shipping && !cart.has_calculated_shipping ? "Delivery charges will be confirmed after you enter your address." : "Prices and delivery charges are confirmed by the store."}</p>
  </aside>;
}

export function CartProblems({ cart }: { cart: StoreCart }) {
  if (!cart.errors?.length) return null;
  return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{cart.errors.map((e, i) => <p key={`${e.code}-${i}`}>{decodeEntities(e.message.replace(/<[^>]*>/g, ""))}</p>)}</div>;
}
