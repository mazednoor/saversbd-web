import Image from "next/image";
import Link from "next/link";
import { decodeEntities, discountPercent, formatMoney, productPrice } from "@/lib/format";
import type { StoreProduct } from "@/lib/woo";

export function ProductCard({ product, priority = false }: { product: StoreProduct; priority?: boolean }) {
  const image = product.images?.[0];
  const discount = discountPercent(product.prices);
  const soldOut = !product.is_in_stock;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:border-line hover:shadow-[0_14px_40px_-24px_rgba(4,0,55,0.45)]">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-haze">
        {image ? (
          <Image
            src={image.src}
            alt={decodeEntities(image.alt || product.name)}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-4 transition duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-xs text-muted">No image</span>
        )}

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discount ? (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-bold text-white">-{discount}%</span>
          ) : null}
          {soldOut ? (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-white">Sold out</span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.categories?.length ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted/80">
            {decodeEntities(product.categories[0].name)}
          </p>
        ) : null}

        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-ink">
          <Link href={`/product/${product.slug}`} className="hover:text-brand">
            {decodeEntities(product.name)}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-2 pt-1">
          <span className="text-base font-bold text-ink">{productPrice(product)}</span>
          {discount ? (
            <span className="text-xs text-muted line-through">
              {formatMoney(product.prices.regular_price, product.prices)}
            </span>
          ) : null}
        </div>

        <Link
          href={`/product/${product.slug}`}
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand opacity-0 transition group-hover:opacity-100 focus:opacity-100"
        >
          View product
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
