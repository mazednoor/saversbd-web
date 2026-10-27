"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMobileMenu } from "./mobile-menu-context";
import { buildTaxonomy, categoryHref } from "@/lib/taxonomy";
import { decodeEntities } from "@/lib/format";
import { WP } from "@/lib/site";
import type { StoreCategory } from "@/lib/woo";

const BLUE = "#2060a0";

export function MobileMenu({ categories }: { categories: StoreCategory[] }) {
  const { open, setOpen } = useMobileMenu();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const close = () => setOpen(false);
  const departments = buildTaxonomy(categories);

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

            <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
              {/* All Categories - two-level drill down */}
              <div className="space-y-0.5">
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      if (expanded === "all-categories") {
                        setExpanded(null);
                        setSelectedDept(null);
                      } else {
                        setExpanded("all-categories");
                        setSelectedDept(null);
                      }
                    }}
                    aria-label={expanded === "all-categories" ? "Close categories" : "Show all categories"}
                    aria-expanded={expanded === "all-categories"}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-3 text-[14px] font-semibold text-ink hover:bg-haze"
                  >
                    <span>All Categories</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`size-4 transition-transform text-muted ${expanded === "all-categories" ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                    </svg>
                  </button>

                  {expanded === "all-categories" && !selectedDept && (
                    <div className="mt-1 ml-2 border-l border-line pl-3 space-y-1">
                      {departments.map((department) => (
                        <button
                          key={department.key}
                          type="button"
                          onClick={() => setSelectedDept(department.key)}
                          className="flex min-h-11 w-full items-center justify-between rounded-lg px-2 py-2 text-[14px] font-semibold text-ink hover:bg-haze"
                        >
                          <span>{department.name}</span>
                          <svg viewBox="0 0 24 24" className="size-4 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                          </svg>
                        </button>
                      ))}
                      <Link
                        href="/categories"
                        onClick={close}
                        className="mt-2 block rounded-lg px-2 py-1.5 text-[14px] font-semibold"
                        style={{ color: BLUE }}
                      >
                        All departments →
                      </Link>
                    </div>
                  )}

                  {selectedDept && (
                    <div className="mt-1 ml-2 border-l border-line pl-3 space-y-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDept(null)}
                        className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-2 text-[14px] font-semibold text-brand hover:bg-brand-soft"
                      >
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span>Back to all categories</span>
                      </button>
                      {departments.map((department) => (
                        department.key === selectedDept && (
                          <div key={department.key}>
                            <Link
                              href={department.landingHref}
                              onClick={close}
                              className="flex min-h-11 items-center rounded-lg px-2 py-2 text-[14px] font-semibold text-ink hover:bg-haze"
                            >
                              View all {department.name} →
                            </Link>
                            <div className="ml-2 mt-2 space-y-3">
                              {department.groups.map((group) => (
                                <div key={group.name}>
                                  <p className="px-2 pb-1 text-[13px] font-bold uppercase tracking-[0.08em] text-ink">
                                    {group.name}
                                  </p>
                                  {group.categories.map((category) => (
                                    <Link
                                      key={category.id}
                                      href={categoryHref(category.slug)}
                                      onClick={close}
                                      className="flex min-h-11 items-center rounded-lg px-2 py-2 text-[14px] text-muted hover:bg-haze hover:text-ink"
                                    >
                                      {decodeEntities(category.name)}
                                    </Link>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>

                {/* E-Services - expandable */}
                <div>
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === "e-services" ? null : "e-services")}
                    aria-label="Show E-Services"
                    aria-expanded={expanded === "e-services"}
                    className="w-full flex items-center justify-between rounded-xl px-3 py-3 text-[14px] font-semibold text-ink hover:bg-haze"
                  >
                    <span>E-Services</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`size-4 transition-transform text-muted ${expanded === "e-services" ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                    </svg>
                  </button>

                  {expanded === "e-services" && (
                    <div className="mt-1 ml-2 border-l border-line pl-3 space-y-1">
                      <a
                        href="/faq"
                        onClick={close}
                        className="block rounded-lg px-2 py-1.5 text-[14px] font-semibold text-ink hover:bg-haze"
                      >
                        FAQ
                      </a>
                      <a
                        href="/contact"
                        onClick={close}
                        className="block rounded-lg px-2 py-1.5 text-[14px] font-semibold text-ink hover:bg-haze"
                      >
                        Contact us
                      </a>
                      <a
                        href="/faq"
                        onClick={close}
                        className="block rounded-lg px-2 py-1.5 text-[14px] font-semibold text-ink hover:bg-haze"
                      >
                        Delivery info
                      </a>
                      <a
                        href="/contact"
                        onClick={close}
                        className="block rounded-lg px-2 py-1.5 text-[14px] font-semibold text-ink hover:bg-haze"
                      >
                        Returns
                      </a>
                      <a
                        href={WP.account}
                        className="block rounded-lg px-2 py-1.5 text-[14px] font-semibold text-ink hover:bg-haze"
                      >
                        My account
                      </a>
                    </div>
                  )}
                </div>

                {/* All Brands - direct link */}
                <Link
                  href="/brands"
                  onClick={close}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-[14px] font-semibold text-ink hover:bg-haze"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  All Brands
                </Link>

                {/* Deal of the Day - direct link */}
                <Link
                  href="/shop?on_sale=1"
                  onClick={close}
                  className="flex items-center gap-2 rounded-xl px-3 py-3 text-[14px] font-semibold text-ink hover:bg-haze"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke={BLUE} strokeWidth="2">
                    <path
                      d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
                      strokeLinecap="round"
                    />
                  </svg>
                  Deal of the Day
                </Link>
              </div>
            </nav>

            <div className="border-t border-line p-3">
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={WP.account}
                  className="flex items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[14px] font-semibold text-ink"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <circle cx="12" cy="8" r="3.6" />
                    <path d="M4.8 20c1.3-3.4 3.9-5 7.2-5s5.9 1.6 7.2 5" strokeLinecap="round" />
                  </svg>
                  Account
                </a>
                <a
                  href={WP.cart}
                  className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white"
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
