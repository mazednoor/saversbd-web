import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/ui";
import { decodeEntities } from "@/lib/format";
import { getCategories, getCategoryBySlug, getProducts, type ProductQuery } from "@/lib/woo";

export const metadata: Metadata = {
  title: "Shop all products",
  description: "Browse every product available at SaversBD with cash on delivery across Bangladesh.",
};

const PER_PAGE = 24;

const SORTS: Record<string, { orderby: ProductQuery["orderby"]; order: ProductQuery["order"] }> = {
  "date-desc": { orderby: "date", order: "desc" },
  "popularity-desc": { orderby: "popularity", order: "desc" },
  "price-asc": { orderby: "price", order: "asc" },
  "price-desc": { orderby: "price", order: "desc" },
  "title-asc": { orderby: "title", order: "asc" },
};

interface ShopSearchParams {
  page?: string;
  category?: string;
  orderby?: string;
  q?: string;
  on_sale?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort = SORTS[params.orderby ?? "date-desc"] ?? SORTS["date-desc"];
  const onSale = params.on_sale === "1";
  const search = params.q?.trim();

  const activeCategory = params.category ? await getCategoryBySlug(params.category) : null;

  const [categories, result] = await Promise.all([
    getCategories(),
    getProducts({
      page,
      perPage: PER_PAGE,
      search,
      onSale,
      category: activeCategory?.id,
      ...sort,
    }),
  ]);

  const topCategories = categories
    .filter((category) => category.parent === 0 && category.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const heading = search
    ? `Search results for “${search}”`
    : onSale
      ? "Deals & offers"
      : activeCategory
        ? decodeEntities(activeCategory.name)
        : "All products";

  const keep = {
    category: params.category,
    q: search,
    on_sale: onSale ? "1" : undefined,
    orderby: params.orderby,
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Shop", href: "/shop" }, ...(activeCategory ? [{ label: decodeEntities(activeCategory.name) }] : [])]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink md:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-muted">
            {result.total.toLocaleString("en-US")} {result.total === 1 ? "product" : "products"}
            {activeCategory?.description ? ` · ${activeCategory.description}` : ""}
          </p>
        </div>
        <SortSelect value={params.orderby ?? "date-desc"} />
      </div>

      {/* Category chips */}
      <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
        <Link
          href="/shop"
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
            !params.category && !onSale && !search ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
          }`}
        >
          All
        </Link>
        <Link
          href="/shop?on_sale=1"
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
            onSale ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
          }`}
        >
          Deals
        </Link>
        {topCategories.map((category) => (
          <Link
            key={category.id}
            href={`/shop?category=${category.slug}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              params.category === category.slug ? "border-ink bg-ink text-white" : "border-line hover:border-ink"
            }`}
          >
            {decodeEntities(category.name)}
          </Link>
        ))}
      </div>

      <div className="mt-8">
        {result.products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {result.products.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 4} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No products found"
            message="Try a different search term, clear the filters, or browse the full catalogue."
            actionHref="/shop"
            actionLabel="Clear filters"
          />
        )}
      </div>

      <Pagination
        currentPage={page}
        totalPages={result.totalPages}
        basePath="/shop"
        params={keep}
      />
    </div>
  );
}
