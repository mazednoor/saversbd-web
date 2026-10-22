"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SearchAutosuggest } from "./search-autosuggest";
import { useMobileMenu } from "./mobile-menu-context";
import { decodeEntities } from "@/lib/format";
import { WP } from "@/lib/site";
import type { StoreCategory } from "@/lib/woo";

const BLUE = "#2060a0";

export function MobileMenu({ categories }: { categories: StoreCategory[] }) {
  const { open, setOpen } = useMobileMenu();
  const [expanded, setExpanded] = useState<number | null>(null);

  const close = () => setOpen(false);

  // Lock page scrolling while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Close with Escape.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const parents = categories
    .filter((c) => c.parent === 0 && c.count > 0 && c.slug !== "uncategorized")
    .sort((a, b) => b.count - a.count)
    .slice(0, 14);

  const childrenOf = (parentId: number) =>
    categories.filter((c) => c.parent === parentId && c.count > 0).sort((a, b) => b.count - a.count);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink md:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={close}
            className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]"
          />

          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="font-display text-lg font-bold" style={{ color: BLUE }}>
                Savers<span className="text-brand">BD</span>
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="grid size-9 place-items-center rounded-full border border-line text-muted"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="border-b border-line p-3">
              <SearchAutosuggest variant="mobile" />
            </div>

            <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
              <div className="space-y-0.5">
                <Link
                  href="/shop"
                  onClick={close}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-haze"
                >
                  All products
                </Link>
                <Link
                  href="/shop?on_sale=1"
                  onClick={close}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-haze"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={BLUE} strokeWidth="2">
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"
                    />
                  </svg>
                  Deal of the Day
                </Link>
                <Link
                  href="/contact"
                  onClick={close}
                  className="block rounded-xl px-3 py-3 text-sm font-semibold text-ink hover:bg-haze"
                >
                  Contact
                </Link>
              </div>

              <div className="my-3 h-px bg-line" />

              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                All categories
              </p>

              <div className="space-y-0.5">
                {parents.map((category) => {
                  const children = childrenOf(category.id);
                  const isOpen = expanded === category.id;
                  return (
                    <div key={category.id}>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/product-category/${category.slug}`}
                          onClick={close}
                          className="min-w-0 flex-1 rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-haze"
                        >
                          {decodeEntities(category.name)}
                        </Link>
                        {children.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpanded(isOpen ? null : category.id)}
                            aria-label={`Show ${decodeEntities(category.name)} subcategories`}
                            aria-expanded={isOpen}
                            className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-haze"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className={`size-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {isOpen && children.length > 0 && (
                        <div className="mb-1 ml-3 border-l border-line pl-2">
                          {children.map((child) => (
                            <Link
                              key={child.id}
                              href={`/product-category/${child.slug}`}
                              onClick={close}
                              className="block rounded-lg px-3 py-2 text-sm text-muted hover:bg-haze hover:text-ink"
                            >
                              {decodeEntities(child.name)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <Link
                  href="/categories"
                  onClick={close}
                  className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-semibold"
                  style={{ color: BLUE }}
                >
                  All departments →
                </Link>
              </div>
            </nav>

            <div className="border-t border-line p-3">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={WP.account}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-sm font-semibold text-ink"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="8" r="3.6" />
                    <path d="M4.8 20c1.3-3.4 3.9-5 7.2-5s5.9 1.6 7.2 5" strokeLinecap="round" />
                  </svg>
                  Account
                </a>
                <a
                  href={WP.cart}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
                  style={{ backgroundColor: BLUE }}
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
                  Cart
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
