import Link from "next/link";
import { SearchAutosuggest } from "./search-autosuggest";
import { getCategories } from "@/lib/woo";
import { AllCategoriesDropdown, EServicesDropdown } from "./header-dropdowns";
import { decodeEntities } from "@/lib/format";
import { CloseDetailsOnOutsideClick } from "./close-details-on-outside-click";
import { WP } from "@/lib/site";

const BLUE = "#2060a0";

export async function SiteHeader() {
  const allCategories = await getCategories();
  const active = allCategories.filter((c) => c.count > 0 && c.slug !== "uncategorized");
  const categories = active
    .filter((c) => c.parent === 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const childrenOf = (parentId: number) =>
    active.filter((c) => c.parent === parentId).sort((a, b) => b.count - a.count);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <CloseDetailsOnOutsideClick />
      {/* Blue accent line (matches the reference header) */}
      <div className="h-1.5" style={{ backgroundColor: BLUE }} />

      {/* Main bar */}
      <div className="container-page grid h-12 grid-cols-[auto_1fr_auto] items-center gap-3 md:h-14">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 font-display text-xl font-bold tracking-tight md:text-2xl"
          style={{ color: BLUE }}
          aria-label="SaversBD home"
        >
          Savers<span className="text-brand">BD</span>
        </Link>

        {/* Search (desktop) */}
        <div className="hidden justify-center md:flex">
          <div className="w-full max-w-3xl">
            <SearchAutosuggest />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 md:gap-2">
          <a
            href={WP.account}
            className="hidden size-9 items-center justify-center rounded-full text-ink transition hover:bg-haze sm:flex"
            aria-label="My account on saversbd.com"
            style={{ color: BLUE }}
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
              <circle cx="12" cy="8" r="3.6" />
              <path d="M4.8 20c1.3-3.4 3.9-5 7.2-5s5.9 1.6 7.2 5" strokeLinecap="round" />
            </svg>
          </a>
          <a
            href={WP.cart}
            className="flex h-9 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BLUE }}
            aria-label="Go to cart on saversbd.com"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.5L21 8H7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1.3" />
              <circle cx="18" cy="20" r="1.3" />
            </svg>
            <span className="hidden sm:inline">Cart</span>
          </a>
        </div>
      </div>

      {/* Menu row (on its own line) */}
      <div className="border-t border-line bg-haze/60">
        <div className="container-page flex flex-wrap items-center gap-1 py-1">
          <nav aria-label="Primary" className="flex items-center gap-1">
            <AllCategoriesDropdown categories={active} />

            <EServicesDropdown />

            <Link
              href="/shop?on_sale=1"
              className="flex items-center gap-1.5 rounded px-3 py-2 text-sm font-medium text-ink hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={BLUE} strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Deal of the Day
            </Link>

            <Link
              href="/shop?on_sale=1"
              className="rounded px-3 py-2 text-sm font-medium text-ink hover:bg-white"
            >
              Promo Flyer
            </Link>

            <a
              href={WP.shop}
              className="rounded px-3 py-2 text-sm font-medium text-ink hover:bg-white"
            >
              SaversBD
            </a>
          </nav>
        </div>
      </div>

      {/* Mobile search */}
      <div className="container-page pb-2 md:hidden">
        <SearchAutosuggest variant="mobile" />
      </div>

      {/* Mobile menu */}
      <details className="group border-t border-line md:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden">
          <span>Browse menu</span>
          <svg viewBox="0 0 24 24" className="size-4 text-muted transition group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" />
          </svg>
        </summary>
        <nav className="container-page space-y-1 pb-4">
          <Link href="/shop" className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-ink hover:bg-haze">
            All products
          </Link>
          <Link href="/shop?on_sale=1" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            Deal of the Day
          </Link>
          <Link href="/shop?on_sale=1" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            Promo Flyer
          </Link>
          <Link href="/categories" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            All Categories
          </Link>
          <Link href="/blog" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            Blog
          </Link>
          <Link href="/contact" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            Contact
          </Link>
          <div className="my-2 h-px bg-line" />
          <p className="px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">Departments</p>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/product-category/${category.slug}`}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted hover:bg-haze hover:text-ink"
            >
              <span>{decodeEntities(category.name)}</span>
              <span className="text-xs text-muted/70">{category.count}</span>
            </Link>
          ))}
          <div className="my-2 h-px bg-line" />
          <a href={WP.account} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            My account
          </a>
          <a href={WP.cart} className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-haze">
            Cart
          </a>
        </nav>
      </details>
    </header>
  );
}
