import type { Metadata } from "next";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SortSelect } from "@/components/sort-select";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/ui";
import { decodeEntities } from "@/lib/format";
import { buildTaxonomy } from "@/lib/taxonomy";
import { getCategories, getProducts, type ProductQuery } from "@/lib/woo";

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

  const categories = await getCategories();
  const departments = buildTaxonomy(categories);

  // `category` accepts one slug or a comma-separated list of slugs
  // (used by the department and group links).
  const slugs = (params.category ?? "").split(",").map((slug) => slug.trim()).filter(Boolean);
  const selected = slugs
    .map((slug) => categories.find((category) => category.slug === slug))
    .filter((category): category is NonNullable<typeof category> => Boolean(category));

  const matchedDepartment = departments.find((department) =>
    department.groups.some((group) =>
      group.categories.every((category) => slugs.includes(category.slug)),
    ),
  );

  const result = await getProducts({
    page,
    perPage: PER_PAGE,
    search,
    onSale,
    category: selected.length ? selected.map((category) => category.id) : undefined,
    ...sort,
  });

  const heading = search
    ? `Search results for “${search}”`
    : onSale
      ? "Deals & offers"
      : matchedDepartment
        ? matchedDepartment.name
        : selected.length === 1
          ? decodeEntities(selected[0].name)
          : selected.length > 1
            ? `${selected.length} categories`
            : "All products";

  const keep = {
    category: params.category,
    q: search,
    on_sale: onSale ? "1" : undefined,
    orderby: params.orderby,
  };

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[
          { label: "Shop", href: "/shop" },
          ...(matchedDepartment ? [{ label: matchedDepartment.name, href: matchedDepartment.href }] : []),
        ]}
      />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink md:text-4xl">{heading}</h1>
          <p className="mt-2 text-sm text-muted">
            {result.total.toLocaleString("en-US")} {result.total === 1 ? "product" : "products"}
            {selected.length === 1 && selected[0].description
              ? ` · ${decodeEntities(selected[0].description)}`
              : ""}
          </p>
        </div>
        <SortSelect value={params.orderby ?? "date-desc"} />
      </div>

      {/* Department chips */}
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
        {departments.map((department) => (
          <Link
            key={department.key}
            href={department.href}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
              matchedDepartment?.key === department.key
                ? "border-ink bg-ink text-white"
                : "border-line hover:border-ink"
            }`}
          >
            {department.name}
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
