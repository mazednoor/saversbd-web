import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BrandCard } from "@/components/brand-card";
import { buildBrands } from "@/lib/brands";
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
        {brands.map((brand) => <BrandCard key={brand.slug} brand={brand} />)}
      </div>
    </div>
  );
}
