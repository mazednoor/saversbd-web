import Image from "next/image";
import Link from "next/link";
import { getProducts } from "@/lib/woo";
import { decodeEntities } from "@/lib/format";

export const metadata = { title: "Cart design preview", robots: { index: false, follow: false } };

/** A design-only preview, separate from the live WooCommerce cart. */
export default async function CartPreview() {
  const { products } = await getProducts({ perPage: 2, inStock: true }).catch(() => ({ products: [] }));
  const subtotal = products.reduce((sum, product) => sum + Number(product.prices.price) / 10 ** product.prices.currency_minor_unit, 0);
  const money = (value: number) => `৳ ${value.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main className="container-page py-8 md:py-12">
      <p className="text-sm text-muted"><Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden="true"> / </span> Cart preview</p>
      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Design preview only. Products and prices below are examples, not your shopping cart. Controls are not active.</div>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.14em] text-brand">Your shopping bag</p><h1 className="mt-2 text-3xl font-bold text-ink md:text-4xl">Your cart</h1><p className="mt-2 text-sm text-muted">Review your items before checkout.</p></div>
        <Link href="/shop" className="text-sm font-semibold text-ink underline underline-offset-4">Continue shopping</Link>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start">
        <section aria-label="Example cart items" className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><h2 className="font-bold text-ink">Cart items</h2><span className="text-sm text-muted">{products.length} example items</span></div>
          {products.length === 0 && <p className="p-5 text-sm text-muted">Example products are temporarily unavailable.</p>}
          {products.map((product) => <div key={product.id} className="flex gap-4 border-b border-line p-5 last:border-0 sm:gap-5">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-haze sm:size-28">{product.images[0] && <Image src={product.images[0].src} alt="" fill sizes="112px" className="object-contain p-2" />}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-wider text-muted">{decodeEntities(product.categories[0]?.name ?? "Product")}</p><h3 className="mt-1 font-semibold leading-snug text-ink">{decodeEntities(product.name)}</h3><p className="mt-1 text-sm text-muted">Example item</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div aria-label="Quantity preview" className="flex h-10 items-center rounded-full border border-line px-4 text-sm text-ink">− <span className="px-5">1</span> +</div><span className="font-bold text-ink">{money(Number(product.prices.price) / 10 ** product.prices.currency_minor_unit)}</span></div><span className="mt-3 inline-block text-sm text-muted">Remove</span></div>
          </div>)}
          <div className="border-t border-line bg-haze/40 p-5"><p className="text-sm font-semibold text-ink">Have a coupon?</p><div className="mt-2 flex gap-2"><div className="flex h-11 flex-1 items-center rounded-lg border border-line bg-white px-3 text-sm text-muted">Enter coupon code</div><span className="flex items-center rounded-lg border border-line px-4 text-sm font-semibold text-ink">Apply</span></div></div>
        </section>
        <aside className="rounded-2xl border border-line bg-white p-5 shadow-[0_14px_40px_-30px_rgba(4,0,55,.35)] sm:p-6"><h2 className="text-lg font-bold text-ink">Order summary</h2><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-4"><span className="text-muted">Subtotal</span><span className="font-semibold text-ink">{money(subtotal)}</span></div><div className="flex justify-between gap-4"><span className="text-muted">Delivery</span><span className="text-right text-muted">Calculated at checkout</span></div></div><div className="mt-5 flex justify-between gap-4 border-t border-line pt-5"><span className="font-bold text-ink">Estimated total</span><span className="text-xl font-bold text-ink">{money(subtotal)}</span></div><div className="mt-5 flex h-12 items-center justify-center rounded-full bg-[#2060a0] px-5 text-sm font-semibold text-white opacity-70">Proceed to checkout</div><p className="mt-4 text-center text-xs leading-relaxed text-muted">Cash on delivery available. Delivery charges are confirmed at checkout.</p></aside>
      </div>
    </main>
  );
}
