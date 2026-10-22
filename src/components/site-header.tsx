import Link from "next/link";
import { SearchForm } from "./search-form";
import { getTopCategories } from "@/lib/woo";
import { decodeEntities } from "@/lib/format";
import { NAV, WP } from "@/lib/site";

export async function SiteHeader() {
  const categories = await getTopCategories(10);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="bg-ink text-white">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11px] sm:text-xs">
          <p className="truncate">Authentic products · Cash on delivery · 24–48h delivery inside Dhaka</p>
          <div className="hidden items-center gap-4 sm:flex">
            <a href={`${WP.account}`} className="hover:text-brand-soft">
              My account
            </a>
            <a href={WP.cart} className="hover:text-brand-soft">
              Cart
            </a>
          </div>
        </div>
      </div>

      <div className="container-page flex h-16 items-center gap-4 md:h-20">
        <details className="group relative md:hidden">
          <summary className="flex size-10 cursor-pointer list-none items-center justify-center rounded-full border border-line [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open menu</span>
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </summary>
          <nav className="absolute left-0 top-12 w-72 rounded-2xl border border-line bg-white p-2 shadow-xl">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-haze">
                {item.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-line" />
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/product-category/${category.slug}`}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm text-muted hover:bg-haze hover:text-ink"
              >
                <span>{decodeEntities(category.name)}</span>
                <span className="text-xs text-muted/70">{category.count}</span>
              </Link>
            ))}
          </nav>
        </details>

        <Link href="/" className="flex shrink-0 items-baseline gap-1" aria-label="SaversBD home">
          <span className="font-display text-2xl font-bold tracking-tight text-ink md:text-[28px]">
            Savers<span className="text-brand">BD</span>
          </span>
        </Link>

        <div className="hidden flex-1 md:block">
          <SearchForm />
        </div>

        <div className="ml-auto flex items-center gap-1 md:gap-2">
          <a
            href={WP.account}
            className="hidden size-10 items-center justify-center rounded-full text-ink hover:bg-haze sm:flex"
            aria-label="My account on saversbd.com"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.8 20c1.3-3.4 3.9-5 7.2-5s5.9 1.6 7.2 5" strokeLinecap="round" />
            </svg>
          </a>
          <a href={WP.cart} className="btn btn-ink h-10 px-4 text-white" aria-label="Go to cart on saversbd.com">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.5L21 8H7" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="10" cy="20" r="1.3" />
              <circle cx="18" cy="20" r="1.3" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
          </a>
        </div>
      </div>

      <div className="container-page pb-2 md:hidden">
        <SearchForm variant="mobile" />
      </div>

      <nav className="hidden border-t border-line md:block">
        <div className="container-page flex items-center gap-1 overflow-x-auto py-1.5 text-sm">
          <Link href="/shop" className="rounded-full px-3 py-1.5 font-semibold text-ink hover:bg-haze">
            All products
          </Link>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1 rounded-full px-3 py-1.5 font-medium text-ink hover:bg-haze [&::-webkit-details-marker]:hidden">
              Categories
              <svg viewBox="0 0 24 24" className="size-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" />
              </svg>
            </summary>
            <div className="absolute left-0 top-10 z-50 w-[680px] rounded-2xl border border-line bg-white p-3 shadow-xl">
              <div className="grid grid-cols-2 gap-1">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/product-category/${category.slug}`}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-sm hover:bg-haze"
                  >
                    <span className="font-medium text-ink">{decodeEntities(category.name)}</span>
                    <span className="text-xs text-muted">{category.count}</span>
                  </Link>
                ))}
              </div>
              <Link href="/categories" className="mt-2 block rounded-xl bg-haze px-3 py-2 text-center text-sm font-semibold text-ink hover:bg-mist">
                Browse all categories →
              </Link>
            </div>
          </details>

          {NAV.filter((item) => item.label !== "Shop" && item.label !== "Categories").map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full px-3 py-1.5 font-medium text-ink hover:bg-haze">
              {item.label}
            </Link>
          ))}
          <a
            href={WP.shop}
            className="ml-auto hidden rounded-full px-3 py-1.5 text-xs font-semibold text-brand hover:underline lg:block"
          >
            Original store →
          </a>
        </div>
      </nav>
    </header>
  );
}
