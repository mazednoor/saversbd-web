import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BrandLogo } from "@/components/brand-logo";
import { buildBrands } from "@/lib/brands";
import { BRAND_LOGOS } from "@/lib/brand-logos";
import { getAllProducts } from "@/lib/woo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop by brand",
  description: "All brands at SaversBD — skincare, baby, hair care, chocolate and more, with cash on delivery.",
};

export default async function BrandsPage() {
  const catalogue = await getAllProducts();
  const brands = buildBrands(catalogue);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Brands" }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">Shop by brands</h1>
        <p className="mt-2 text-sm text-muted">
          {brands.length} brands across skincare, baby care, hair, deodorants, toys and treats — all authentic,
          all cash on delivery.
        </p>
      </header>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={`/brand/${brand.slug}`}
            className="group flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-28px_rgba(4,0,55,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <BrandLogo name={brand.name} src={BRAND_LOGOS[brand.slug]?.url} />
            <span className="text-sm font-semibold leading-tight text-ink">{brand.name}</span>
            <span className="text-[13px] text-muted">{brand.count} products</span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-xs leading-relaxed text-muted">
        Logo sources: {brands.filter((brand) => BRAND_LOGOS[brand.slug]).map((brand, index) => (
          <span key={brand.slug}>
            {index > 0 ? ", " : ""}
            <a href={BRAND_LOGOS[brand.slug].source} target="_blank" rel="noreferrer" className="underline hover:text-ink">{brand.name}</a>
          </span>
        ))}. Other brands are shown as text while their logos are being sourced.
      </p>
    </div>
  );
}
