import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { buildTaxonomy } from "@/lib/taxonomy";
import { decodeEntities } from "@/lib/format";
import { getCategories } from "@/lib/woo";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "All departments",
  description:
    "Browse every department at SaversBD — skincare and beauty, baby and mother, hair care, deodorants and fragrance, toys, health and grooming.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();
  const departments = buildTaxonomy(categories);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: "Departments" }]} />

      <header className="mt-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-ink md:text-4xl">All departments</h1>
        <p className="mt-2 text-sm text-muted">
          {departments.length} departments, {categories.filter((c) => c.count > 0 && c.slug !== "uncategorized").length}{" "}
          categories — from skincare to toys, all with cash on delivery across Bangladesh.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {departments.map((department) => (
          <section key={department.key} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <Link
                href={department.href}
                className="font-display text-lg font-semibold text-ink hover:text-brand"
              >
                {department.name}
              </Link>
              <span className="shrink-0 text-xs text-muted">{department.count} products</span>
            </div>

            <div className="mt-4 space-y-4">
              {department.groups.map((group) => (
                <div key={group.name}>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                      {group.name}
                    </p>
                    <Link href={group.href} className="text-[11px] font-semibold text-brand hover:underline">
                      View all
                    </Link>
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {group.categories.map((category) => (
                      <li key={category.id}>
                        <Link
                          href={`/product-category/${category.slug}`}
                          className="inline-block rounded-full bg-haze px-2.5 py-1 text-xs text-muted transition hover:bg-mist hover:text-ink"
                        >
                          {decodeEntities(category.name)}
                          <span className="ml-1 text-[10px] text-muted/70">{category.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
