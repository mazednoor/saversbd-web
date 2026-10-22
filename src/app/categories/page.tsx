import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { buildTaxonomy, categoryHref } from "@/lib/taxonomy";
import { decodeEntities } from "@/lib/format";
import { buildCategoryCovers, getAllProducts, getCategories } from "@/lib/woo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All categories",
  description:
    "Browse every department and subcategory at SaversBD — skincare and beauty, baby and mother, hair care, deodorants and fragrance, toys, health and grooming.",
};

export default async function CategoriesPage() {
  const [categories, catalogue] = await Promise.all([getCategories(), getAllProducts()]);

  const departments = buildTaxonomy(categories);
  const covers = buildCategoryCovers(catalogue);

  const totalCategories = departments.reduce(
    (sum, department) => sum + department.groups.reduce((n, group) => n + group.categories.length, 0),
    0,
  );

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Categories" }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">All categories</h1>
        <p className="mt-2 text-sm text-muted">
          {departments.length} departments and {totalCategories} subcategories — pick a shelf to see what is in
          stock, with cash on delivery across Bangladesh.
        </p>
      </header>

      {/* Department quick jump */}
      <nav aria-label="Departments" className="mt-6 flex flex-wrap gap-2">
        {departments.map((department) => (
          <a
            key={department.key}
            href={`#${department.key}`}
            className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-ink transition hover:border-ink hover:bg-haze"
          >
            {department.name}
          </a>
        ))}
      </nav>

      {/* Department landing pages */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {departments.map((department) => {
          const cover = department.anchor ? covers.get(department.anchor.id) : null;
          return (
            <Link
              key={department.key}
              href={department.landingHref}
              className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-28px_rgba(4,0,55,0.5)]"
            >
              <span className="relative block aspect-square overflow-hidden bg-haze">
                {cover ? (
                  <Image
                    src={cover.src}
                    alt={department.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 200px"
                    className="object-contain p-4 transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-[13px] text-muted">No image</span>
                )}
              </span>
              <span className="flex flex-1 flex-col gap-0.5 p-3">
                <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
                  {department.name}
                </span>
                <span className="mt-auto pt-1 text-[13px] text-muted">{department.count} products</span>
              </span>
            </Link>
          );
        })}
      </div>

      {departments.map((department) => (
        <section key={department.key} id={department.key} className="mt-12 scroll-mt-32 first:mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
            <div>
              <h2 className="font-display text-2xl font-bold text-ink">{department.name}</h2>
              <p className="mt-1 text-sm text-muted">
                {department.groups.reduce((n, group) => n + group.categories.length, 0)} subcategories ·{" "}
                {department.count} products
              </p>
            </div>
            <Link
              href={department.landingHref}
              className="text-sm font-semibold text-ink underline-offset-4 hover:text-brand hover:underline"
            >
              Shop all {department.name} →
            </Link>
          </div>

          {department.groups.map((group) => (
            <div key={group.name} className="mt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{group.name}</h3>
                <Link href={group.href} className="text-[13px] font-semibold text-brand hover:underline">
                  View all {group.count}
                </Link>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {group.categories.map((category) => {
                  const cover = covers.get(category.id);
                  return (
                    <Link
                      key={category.id}
                      href={categoryHref(category.slug)}
                      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-28px_rgba(4,0,55,0.5)]"
                    >
                      <span className="relative block aspect-square overflow-hidden bg-haze">
                        {cover ? (
                          <Image
                            src={cover.src}
                            alt={decodeEntities(category.name)}
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
                          {decodeEntities(category.name)}
                        </span>
                        <span className="mt-auto pt-1 text-[13px] text-muted">
                          {category.count} products
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
