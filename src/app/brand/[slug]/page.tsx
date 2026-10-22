import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { EmptyState } from "@/components/ui";
import { absoluteUrl, decodeEntities } from "@/lib/format";
import { buildBrands, getBrand, productsForBrand } from "@/lib/brands";
import { getAllProducts, type ProductQuery } from "@/lib/woo";

export const revalidate = 3600;

const PER_PAGE = 24;

const SORTS: Record<string, { orderby: ProductQuery["orderby"]; order: ProductQuery["order"] }> = {
  "date-desc": { orderby: "date", order: "desc" },
  "popularity-desc": { orderby: "popularity", order: "desc" },
  "price-asc": { orderby: "price", order: "asc" },
  "price-desc": { orderby: "price", order: "desc" },
  "title-asc": { orderby: "title", order: "asc" },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; orderby?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return { title: "Brand not found" };

  const description = `Shop ${brand.name} at SaversBD — authentic products, cash on delivery across Bangladesh.`;

  return {
    title: `${brand.name} products`,
    description,
    alternates: { canonical: absoluteUrl(`/brand/${brand.slug}`) },
    openGraph: { title: brand.name, description, url: absoluteUrl(`/brand/${brand.slug}`) },
  };
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const brand = getBrand(slug);
  if (!brand) notFound();

  const page = Math.max(1, Number(query.page) || 1);
  const sort = SORTS[query.orderby ?? "date-desc"] ?? SORTS["date-desc"];

  const catalogue = await getAllProducts();
  const all = productsForBrand(catalogue, brand.slug);
  const total = all.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const sorted = [...all].sort((a, b) => {
    const key = query.orderby ?? "date-desc";
    if (key === "price-asc") return Number(a.prices.price) - Number(b.prices.price);
    if (key === "price-desc") return Number(b.prices.price) - Number(a.prices.price);
    if (key === "title-asc") return a.name.localeCompare(b.name);
    return 0;
  });

  const products = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const others = buildBrands(catalogue)
    .filter((item) => item.slug !== brand.slug)
    .slice(0, 10);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Brands", href: "/brands" }, { label: brand.name }]} />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-brand">Shop by brand</p>
          <h1 className="mt-1 text-3xl font-bold text-ink md:text-4xl">{brand.name}</h1>
          <p className="mt-2 text-sm text-muted">
            {total.toLocaleString("en-US")} {total === 1 ? "product" : "products"} · cash on delivery across
            Bangladesh
          </p>
        </div>
        <SortSelect value={query.orderby ?? "date-desc"} />
      </header>

      <div className="mt-8">
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products found"
            message="This brand has no products right now. Try another brand from the list below."
            actionHref="/brands"
            actionLabel="Browse brands"
          />
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath={`/brand/${brand.slug}`}
        params={{ orderby: query.orderby }}
      />

      {others.length ? (
        <section className="mt-14 border-t border-line pt-8">
          <h2 className="text-lg font-bold text-ink">Other brands</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {others.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/brand/${item.slug}`}
                  className="inline-block rounded-full border border-line px-3 py-1.5 text-sm text-muted transition hover:border-ink hover:text-ink"
                >
                  {item.name}
                  <span className="ml-1.5 text-xs text-muted/70">{item.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
