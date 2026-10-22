import type { Metadata } from "next";
import Link from "next/link";
import { FilterPanel, type BrandOption, type ShopFilters } from "@/components/filter-panel";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/ui";
import { buildTaxonomy } from "@/lib/taxonomy";
import { buildBrands, getBrand } from "@/lib/brands";
import { getAllProducts, getCategories, getProducts, type ProductQuery } from "@/lib/woo";

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
  department?: string;
  group?: string;
  brand?: string;
  min?: string;
  max?: string;
  instock?: string;
  on_sale?: string;
  orderby?: string;
  q?: string;
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<ShopSearchParams> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const sort = SORTS[params.orderby ?? "date-desc"] ?? SORTS["date-desc"];
  const onSale = params.on_sale === "1";
  const inStock = params.instock === "1";
  const search = params.q?.trim();
  const departmentKey = params.department ?? "";
  const groupSlug = params.group ?? "";
  const brandSlug = params.brand ?? "";
  const minPrice = params.min ? Number(params.min) : null;
  const maxPrice = params.max ? Number(params.max) : null;

  const categories = await getCategories();
  const departments = buildTaxonomy(categories);

  const activeDepartment = departments.find((department) => department.key === departmentKey) ?? null;

  // Sub-category (group) — scoped to the chosen department when there is one.
  const allGroups = departments.flatMap((department) =>
    department.groups.map((group) => ({ department, group })),
  );
  const activeGroupEntry = allGroups.find((entry) => entry.group.slug === groupSlug) ?? null;

  // Category ids: group > department > legacy `category` list.
  const legacySlugs = (params.category ?? "").split(",").map((slug) => slug.trim()).filter(Boolean);
  const legacyCategories = legacySlugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));

  let categoryIds: number[] | undefined;
  if (activeGroupEntry) {
    categoryIds = activeGroupEntry.group.categoryIds;
  } else if (activeDepartment) {
    categoryIds = activeDepartment.categoryIds;
  } else if (legacyCategories.length) {
    categoryIds = legacyCategories.map((category) => category.id);
  }

  // Brands are matched from the product name, so a brand filter is a search.
  const brand = brandSlug ? getBrand(brandSlug) : null;
  const brandSearch = brand ? brand.matchers[0] : undefined;

  const result = await getProducts({
    page,
    perPage: PER_PAGE,
    search: brandSearch ?? search,
    onSale,
    inStock,
    category: categoryIds,
    minPrice: minPrice != null ? Math.round(minPrice * 100) : undefined,
    maxPrice: maxPrice != null ? Math.round(maxPrice * 100) : undefined,
    ...sort,
  });

  // Brand list (counts come from the catalogue, cached for an hour).
  const brandOptions: BrandOption[] = buildBrands(await getAllProducts()).map((item) => ({
    slug: item.slug,
    name: item.name,
    count: item.count,
  }));

  const filters: ShopFilters = {
    department: departmentKey,
    group: groupSlug,
    brand: brandSlug,
    min: params.min ?? "",
    max: params.max ?? "",
    instock: inStock,
    onSale,
    query: search ?? "",
    orderby: params.orderby ?? "",
  };

  const activeCount = [
    departmentKey,
    groupSlug,
    brandSlug,
    params.min,
    params.max,
    inStock ? "1" : "",
    onSale ? "1" : "",
  ].filter(Boolean).length;

  const heading = brand
    ? brand.name
    : search
      ? `Search results for “${search}”`
      : onSale
        ? "Deals & offers"
        : activeGroupEntry
          ? activeGroupEntry.group.name
          : activeDepartment
            ? activeDepartment.name
            : "All products";

  const keep = {
    department: departmentKey || undefined,
    group: groupSlug || undefined,
    brand: brandSlug || undefined,
    min: params.min,
    max: params.max,
    instock: inStock ? "1" : undefined,
    on_sale: onSale ? "1" : undefined,
    q: search,
    orderby: params.orderby,
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          ...(activeDepartment ? [{ label: activeDepartment.name }] : []),
          ...(activeGroupEntry ? [{ label: activeGroupEntry.group.name }] : []),
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink md:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-muted">
            {result.total.toLocaleString("en-US")} {result.total === 1 ? "product" : "products"}
            {activeCount > 0 ? " matching your filters" : " — cash on delivery across Bangladesh"}
          </p>
        </div>
        <SortSelect value={params.orderby ?? "date-desc"} />
      </div>

      {/* Department quick filters */}
      <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
        <Link
          href="/shop"
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
            !departmentKey && !groupSlug && !onSale && !search && !brandSlug
              ? "border-ink bg-ink text-white"
              : "border-line hover:border-ink"
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
        {departments.map((department) => (
          <Link
            key={department.key}
            href={`/shop?department=${department.key}`}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              departmentKey === department.key
                ? "border-ink bg-ink text-white"
                : "border-line hover:border-ink"
            }`}
          >
            {department.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Filters — sidebar on desktop, collapsible panel on mobile */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <details className="group rounded-2xl border border-line bg-white p-4 lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
              <span>Filters{activeCount > 0 ? ` (${activeCount})` : ""}</span>
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-muted transition group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="mt-4 border-t border-line pt-4">
              <FilterPanel
                filters={filters}
                departments={departments}
                groups={allGroups}
                brands={brandOptions}
                activeCount={activeCount}
              />
            </div>
          </details>

          <div className="hidden rounded-2xl border border-line bg-white p-5 lg:block">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-ink">
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </h2>
            <FilterPanel
              filters={filters}
              departments={departments}
              groups={allGroups}
              brands={brandOptions}
              activeCount={activeCount}
            />
          </div>
        </aside>

        <div>
          {result.products.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {result.products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No products match these filters"
              message="Try widening the price range, choosing a different sub-category, or clearing the filters."
              actionHref="/shop"
              actionLabel="Clear filters"
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            basePath="/shop"
            params={keep}
          />
        </div>
      </div>
    </div>
  );
}
