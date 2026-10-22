import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { EmptyState } from "@/components/ui";
import { absoluteUrl, decodeEntities, excerptFrom } from "@/lib/format";
import { CATEGORY_ALIASES } from "@/lib/category-aliases";
import { buildTaxonomy, findPlacement } from "@/lib/taxonomy";
import { buildBrands, getBrand } from "@/lib/brands";
import { FilterPanel, type BrandOption, type ShopFilters } from "@/components/filter-panel";
import {
  getCategoryBySlug,
  getCategories,
  getChildCategories,
  getAllProducts,
  getProducts,
  type ProductQuery,
  type StoreCategory,
} from "@/lib/woo";

export const revalidate = 600;

const PER_PAGE = 24;

const SORTS: Record<string, { orderby: ProductQuery["orderby"]; order: ProductQuery["order"] }> = {
  "date-desc": { orderby: "date", order: "desc" },
  "popularity-desc": { orderby: "popularity", order: "desc" },
  "price-asc": { orderby: "price", order: "asc" },
  "price-desc": { orderby: "price", order: "desc" },
  "title-asc": { orderby: "title", order: "asc" },
};

type PageProps = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{
    page?: string;
    orderby?: string;
    brand?: string;
    min?: string;
    max?: string;
    instock?: string;
    on_sale?: string;
  }>;
};

/** Resolves /product-category/toys and /product-category/toys/0-12m alike. */
async function resolveCategory(segments: string[]) {
  const slug = segments[segments.length - 1];

  // Categories that were merged away still have live URLs — send them to the
  // category that absorbed them.
  const alias = CATEGORY_ALIASES[slug];
  if (alias) {
    permanentRedirect(`/product-category/${alias}`);
  }

  const category = await getCategoryBySlug(slug);
  if (!category) return null;
  // "Uncategorized" is a WordPress default bucket, not a shoppable department.
  if (category.slug === "uncategorized") return null;

  const categories = await getCategories();
  const byId = new Map(categories.map((item) => [item.id, item]));
  const chain: StoreCategory[] = [];
  let cursor: StoreCategory | undefined = category;
  while (cursor && chain.length < 6) {
    chain.unshift(cursor);
    cursor = cursor.parent ? byId.get(cursor.parent) : undefined;
  }
  return { category, chain };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveCategory(slug);
  if (!resolved) return { title: "Category not found" };

  const { category } = resolved;
  const name = decodeEntities(category.name);
  const description =
    excerptFrom(category.description, 158) ||
    `Shop ${name} at SaversBD — authentic products, cash on delivery across Bangladesh.`;

  return {
    title: name,
    description,
    alternates: { canonical: absoluteUrl(`/product-category/${category.slug}`) },
    openGraph: { title: name, description, url: absoluteUrl(`/product-category/${category.slug}`) },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const resolved = await resolveCategory(slug);
  if (!resolved) notFound();

  const { category, chain } = resolved;
  const page = Math.max(1, Number(query.page) || 1);
  const sort = SORTS[query.orderby ?? "date-desc"] ?? SORTS["date-desc"];

  const brandSlug = query.brand ?? "";
  const brand = brandSlug ? getBrand(brandSlug) : null;
  const minPrice = query.min ? Number(query.min) : null;
  const maxPrice = query.max ? Number(query.max) : null;
  const inStock = query.instock === "1";
  const onSale = query.on_sale === "1";

  const [children, allCategories, catalogue] = await Promise.all([
    getChildCategories(category.id),
    getCategories(),
    getAllProducts(),
  ]);

  const result = await getProducts({
    page,
    perPage: PER_PAGE,
    category: category.id,
    search: brand ? brand.matchers[0] : undefined,
    inStock,
    onSale,
    minPrice: minPrice != null ? Math.round(minPrice * 100) : undefined,
    maxPrice: maxPrice != null ? Math.round(maxPrice * 100) : undefined,
    ...sort,
  });

  // Where this category sits in the curated department taxonomy.
  const taxonomy = buildTaxonomy(allCategories);
  const placement = findPlacement(taxonomy, category.slug);
  const siblings = placement
    ? placement.group.categories.filter((item) => item.slug !== category.slug)
    : children;

  const brandOptions: BrandOption[] = buildBrands(catalogue).map((item) => ({
    slug: item.slug,
    name: item.name,
    count: item.count,
  }));

  const filters: ShopFilters = {
    department: "",
    group: "",
    brand: brandSlug,
    min: query.min ?? "",
    max: query.max ?? "",
    instock: inStock,
    onSale,
    query: "",
    orderby: query.orderby ?? "",
  };

  const activeCount = [brandSlug, query.min, query.max, inStock ? "1" : "", onSale ? "1" : ""].filter(
    Boolean,
  ).length;

  const categoryHref = `/product-category/${category.slug}`;

  const crumbs = [
    { label: "Shop", href: "/shop" },
    ...(placement
      ? [
          { label: placement.department.name, href: placement.department.href },
          { label: placement.group.name, href: placement.group.href },
        ]
      : chain.slice(0, -1).map((item) => ({ label: decodeEntities(item.name), href: `/product-category/${item.slug}` }))),
    { label: decodeEntities(category.name) },
  ];

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={crumbs} />

      <header className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink md:text-4xl">{decodeEntities(category.name)}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {decodeEntities(category.description) || `All ${decodeEntities(category.name).toLowerCase()} available at SaversBD.`}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted/80">
            {result.total.toLocaleString("en-US")} {result.total === 1 ? "product" : "products"}
          </p>
        </div>
        <SortSelect value={query.orderby ?? "date-desc"} />
      </header>

      {siblings.length ? (
        <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
          {siblings.map((sibling) => (
            <Link
              key={sibling.id}
              href={`/product-category/${sibling.slug}`}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium hover:border-ink ${
                sibling.slug === category.slug ? "border-ink bg-ink text-white" : "border-line"
              }`}
            >
              {decodeEntities(sibling.name)}
              <span className="ml-1.5 text-xs opacity-70">{sibling.count}</span>
            </Link>
          ))}
        </div>
      ) : null}

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
                brands={brandOptions}
                activeCount={activeCount}
                action={categoryHref}
                clearHref={categoryHref}
                showDepartment={false}
                showGroups={false}
              />
            </div>
          </details>

          <div className="hidden rounded-2xl border border-line bg-white p-5 lg:block">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-ink">
              Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </h2>
            <FilterPanel
              filters={filters}
              brands={brandOptions}
              activeCount={activeCount}
              action={categoryHref}
              clearHref={categoryHref}
              showDepartment={false}
              showGroups={false}
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
              title="Nothing matches these filters"
              message="Try a different brand or a wider price range, or browse the rest of the catalogue."
              actionHref={categoryHref}
              actionLabel="Clear filters"
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            basePath={categoryHref}
            params={{
              brand: brandSlug || undefined,
              min: query.min,
              max: query.max,
              instock: inStock ? "1" : undefined,
              on_sale: onSale ? "1" : undefined,
              orderby: query.orderby,
            }}
          />
        </div>
      </div>
    </div>
  );
}
