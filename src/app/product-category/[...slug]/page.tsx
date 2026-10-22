import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { EmptyState } from "@/components/ui";
import { absoluteUrl, decodeEntities, excerptFrom } from "@/lib/format";
import { CATEGORY_ALIASES } from "@/lib/category-aliases";
import { buildTaxonomy, findPlacement, categoryHref, isDepartmentCategory } from "@/lib/taxonomy";
import { buildBrands, getBrand } from "@/lib/brands";
import { FilterPanel, type BrandOption, type ShopFilters } from "@/components/filter-panel";
import {
  getCategoryBySlug,
  getCategories,
  getChildCategories,
  getAllProducts,
  buildCategoryCovers,
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
    permanentRedirect(categoryHref(alias));
  }

  const category = await getCategoryBySlug(slug);
  if (!category) return null;
  // "Uncategorized" is a WordPress default bucket, not a shoppable department.
  if (category.slug === "uncategorized") return null;

  // Only the 7 top-level departments have a landing page. Every other
  // category opens the shop page filtered to that category.
  if (!isDepartmentCategory(category.slug)) {
    permanentRedirect(`/shop?category=${category.slug}`);
  }

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
  const department = taxonomy.find((item) => item.anchor?.slug === category.slug) ?? null;
  const siblings = placement
    ? placement.group.categories.filter((item) => item.slug !== category.slug)
    : children;

  // The shelf shown on the page:
  //  - a department page lists every category inside it, grouped by shelf
  //  - a category page lists its own children plus its shelf siblings
  const covers = buildCategoryCovers(catalogue);

  interface ShelfItem {
    key: string;
    name: string;
    href: string;
    count: number;
    imageId: number;
    group?: string;
  }

  const shelf: ShelfItem[] = department
    ? department.groups.flatMap((group) =>
        group.categories
          .filter((item) => item.count > 0)
          .map((item) => ({
            key: item.slug,
            name: decodeEntities(item.name),
            href: categoryHref(item.slug),
            count: item.count,
            imageId: item.id,
            group: group.name,
          })),
      )
    : Array.from(
        new Map([...children, ...siblings].map((item) => [item.id, item])).values(),
      )
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count)
        .map((item) => ({
          key: item.slug,
          name: decodeEntities(item.name),
          href: categoryHref(item.slug),
          count: item.count,
          imageId: item.id,
        }));

  // A category that has a shelf is a landing page: it shows the
  // subcategory tiles, not a duplicate product list.
  const showTiles = shelf.length > 0;

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

  const categoryPath = `/product-category/${category.slug}`;

  const crumbs = [
    { label: "Shop", href: "/shop" },
    ...(placement
      ? [
          { label: placement.department.name, href: placement.department.href },
          { label: placement.group.name, href: placement.group.href },
        ]
      : chain.slice(0, -1).map((item) => ({ label: decodeEntities(item.name), href: categoryHref(item.slug) }))),
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
            {showTiles
              ? `${shelf.length} subcategories · ${result.total.toLocaleString("en-US")} products`
              : `${result.total.toLocaleString("en-US")} ${result.total === 1 ? "product" : "products"}`}
          </p>
          {showTiles ? (
            <Link
              href={`/shop?category=${category.slug}`}
              className="mt-2 inline-block text-sm font-semibold text-brand hover:underline"
            >
              View all {result.total.toLocaleString("en-US")} products →
            </Link>
          ) : null}
        </div>
        {showTiles ? null : <SortSelect value={query.orderby ?? "date-desc"} />}
      </header>

      {!showTiles && siblings.length ? (
        <div className="-mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-2">
          {siblings.map((sibling) => (
            <Link
              key={sibling.id}
              href={categoryHref(sibling.slug)}
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

      {/* Subcategories with images */}
      {showTiles ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-muted">
            Shop by subcategory
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {shelf.map((item) => {
              const cover = covers.get(item.imageId);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-28px_rgba(4,0,55,0.5)]"
                >
                  <span className="relative block aspect-square overflow-hidden bg-haze">
                    {cover ? (
                      <Image
                        src={cover.src}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                        className="object-contain p-4 transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="grid h-full place-items-center text-[13px] text-muted">No image</span>
                    )}
                  </span>
                  <span className="flex flex-1 flex-col gap-0.5 p-3">
                    <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                      {item.name}
                    </span>
                    <span className="mt-auto pt-1 text-[13px] text-muted">{item.count} products</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {showTiles ? null : (
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
                action={categoryPath}
                clearHref={categoryPath}
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
              action={categoryPath}
              clearHref={categoryPath}
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
              actionHref={categoryPath}
              actionLabel="Clear filters"
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            basePath={categoryPath}
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
      )}
    </div>
  );
}
