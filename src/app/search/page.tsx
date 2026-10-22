import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui";
import { decodeEntities } from "@/lib/format";
import { getProducts } from "@/lib/woo";
import { getPosts } from "@/lib/wp";

export const metadata: Metadata = {
  title: "Search",
  description: "Search products at SaversBD.",
  robots: { index: false, follow: true },
};

const PER_PAGE = 24;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = "", page: pageParam } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(pageParam) || 1);

  if (!query) {
    return (
      <div className="container-page py-10">
        <Breadcrumbs items={[{ label: "Search" }]} />
        <h1 className="mt-4 text-3xl font-bold text-ink">Search SaversBD</h1>
        <div className="mt-6 max-w-xl">
          <form action="/search" method="get" className="flex gap-2">
            <input
              name="q"
              type="search"
              autoFocus
              placeholder="What are you looking for?"
              className="h-11 flex-1 rounded-full border border-line px-4 text-sm focus:border-brand focus:outline-none"
            />
            <button type="submit" className="btn btn-primary h-11">
              Search
            </button>
          </form>
        </div>
      </div>
    );
  }

  const [{ products, total, totalPages }, { posts }] = await Promise.all([
    getProducts({ search: query, page, perPage: PER_PAGE, orderby: "popularity" }),
    getPosts({ search: query, perPage: 3 }),
  ]);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Search" }]} />

      <header className="mt-4">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">
          Results for <span className="text-brand">“{query}”</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          {total.toLocaleString("en-US")} matching {total === 1 ? "product" : "products"}
        </p>
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
            title="Nothing matched that search"
            message="Check the spelling, try a shorter phrase, or browse categories to find what you need."
            actionHref="/categories"
            actionLabel="Browse categories"
          />
        )}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} basePath="/search" params={{ q: query }} />

      {posts.length ? (
        <section className="mt-14">
          <h2 className="text-xl font-bold text-ink">Articles mentioning “{query}”</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {posts.map((post) => (
              <li key={post.id}>
                <a href={`/blog/${post.slug}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-haze">
                  <span className="text-sm font-medium text-ink">{decodeEntities(post.title.rendered)}</span>
                  <span className="text-xs text-brand">Read →</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
