import Link from "next/link";
import { SearchAutosuggest } from "./search-autosuggest";
import { MobileMenu } from "./mobile-menu";
import { getCategories } from "@/lib/woo";
import { AllCategoriesDropdown, EServicesDropdown } from "./header-dropdowns";
import { CloseDetailsOnOutsideClick } from "./close-details-on-outside-click";
import { WP } from "@/lib/site";

const BLUE = "#2060a0";

export async function SiteHeader() {
  const allCategories = await getCategories();
  const active = allCategories.filter((c) => c.count > 0 && c.slug !== "uncategorized");

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <CloseDetailsOnOutsideClick />

      {/* Main bar */}
      <div className="container-page flex h-14 items-center gap-3 md:h-16 md:gap-4">
        {/* Left group: mobile menu button + logo */}
        <div className="flex shrink-0 items-center gap-3">
          <MobileMenu categories={active} />
          <Link
            href="/"
            className="font-display text-[20px] font-bold tracking-tight md:text-[24px]"
            style={{ color: BLUE }}
            aria-label="SaversBD home"
          >
            Savers<span className="text-brand">BD</span>
          </Link>
        </div>

        {/* Search (desktop only) */}
        <div className="hidden flex-1 justify-center md:flex">
          <div className="w-full max-w-3xl">
            <SearchAutosuggest />
          </div>
        </div>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1 md:gap-2">
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
            className="flex h-9 items-center gap-2 rounded-full px-3 text-[14px] font-semibold text-white transition hover:opacity-90"
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

      {/* Menu row (desktop only — mobile uses the drawer) */}
      <div className="hidden bg-haze/60 md:block">
        <div className="container-page flex flex-wrap items-center gap-2 py-2">
          <nav aria-label="Primary" className="flex items-center gap-1">
            <AllCategoriesDropdown categories={active} />

            <EServicesDropdown />

            <Link
              href="/brands"
              className="flex items-center gap-1.5 rounded px-3 py-2 text-[14px] font-medium text-ink hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              All Brands
            </Link>

            <Link
              href="/shop?on_sale=1"
              className="flex items-center gap-1.5 rounded px-3 py-2 text-[14px] font-medium text-ink hover:bg-white"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={BLUE} strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Deal of the Day
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
