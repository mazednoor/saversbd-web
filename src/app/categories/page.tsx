import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { decodeEntities } from "@/lib/format";
import { getCategories } from "@/lib/woo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All categories",
  description: "Browse every department at SaversBD — baby care, skincare, toys, household and more.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  const active = categories.filter(
    (category) => category.count > 0 && category.slug !== "uncategorized",
  );
  const parents = active.filter((category) => category.parent === 0).sort((a, b) => b.count - a.count);
  const childrenOf = (parentId: number) =>
    active.filter((category) => category.parent === parentId).sort((a, b) => b.count - a.count);

  // Categories whose parent is not in the fetched list still deserve a home.
  const orphaned = active.filter(
    (category) => category.parent !== 0 && !active.some((parent) => parent.id === category.parent),
  );

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Categories" }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">All categories</h1>
        <p className="mt-2 text-sm text-muted">
          {active.length} departments and collections, from imported diapers to skincare and toys.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {parents.map((parent) => {
          const children = childrenOf(parent.id);
          return (
            <section key={parent.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/product-category/${parent.slug}`}
                  className="font-display text-lg font-semibold text-ink hover:text-brand"
                >
                  {decodeEntities(parent.name)}
                </Link>
                <span className="text-xs text-muted">{parent.count}</span>
              </div>

              {children.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {children.slice(0, 8).map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/product-category/${child.slug}`}
                        className="inline-block rounded-full bg-haze px-2.5 py-1 text-xs text-muted transition hover:bg-mist hover:text-ink"
                      >
                        {decodeEntities(child.name)}
                      </Link>
                    </li>
                  ))}
                  {children.length > 8 ? (
                    <li>
                      <Link
                        href={`/product-category/${parent.slug}`}
                        className="inline-block rounded-full px-2.5 py-1 text-xs font-semibold text-brand"
                      >
                        +{children.length - 8} more
                      </Link>
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </section>
          );
        })}
      </div>

      {orphaned.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">More collections</h2>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {orphaned.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/product-category/${category.slug}`}
                  className="inline-block rounded-full border border-line px-3 py-1.5 text-xs hover:border-ink"
                >
                  {decodeEntities(category.name)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
