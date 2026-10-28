import Link from "next/link";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { BrandLogo } from "./brand-logo";

/** Shared by the homepage and directory so logos, spacing and fallbacks match. */
export function BrandCard({ brand }: { brand: { slug: string; name: string; count: number } }) {
  return (
    <Link
      href={`/brand/${brand.slug}`}
      className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-28px_rgba(4,0,55,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <BrandLogo name={brand.name} src={BRAND_LOGOS[brand.slug]?.url} />
      <span className="text-sm font-semibold leading-tight text-ink">{brand.name}</span>
      <span className="text-[13px] text-muted">{brand.count} {brand.count === 1 ? "product" : "products"}</span>
    </Link>
  );
}
