"use client";

import { useState } from "react";
import Link from "next/link";
import { decodeEntities } from "@/lib/format";
import { WP } from "@/lib/site";
import type { StoreCategory } from "@/lib/woo";

const BLUE = "#2060a0";

interface AllCategoriesDropdownProps {
  categories: StoreCategory[];
}

export function AllCategoriesDropdown({ categories }: AllCategoriesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [flyout, setFlyout] = useState<number | null>(null);

  const childrenOf = (parentId: number) =>
    categories
      .filter((c) => c.parent === parentId && c.count > 0)
      .sort((a, b) => b.count - a.count);

  // Top-level parents are those with parent === 0
  const parents = categories
    .filter((c) => c.parent === 0 && c.count > 0 && c.slug !== "uncategorized")
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        setOpen(false);
        setFlyout(null);
      }}
    >
      <button
        type="button"
        className="flex cursor-default items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: BLUE }}
      >
        All Categories
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 w-72 rounded-xl border border-line bg-white p-3 shadow-xl">
          <Link
            href="/shop"
            className="mb-1 block rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ color: BLUE }}
          >
            All products →
          </Link>
          <div className="my-1 h-px bg-line" />
          {parents.map((category) => {
            const children = childrenOf(category.id);
            return (
              <div
                key={category.id}
                className="group/sub relative"
                onMouseEnter={() => setFlyout(category.id)}
                onMouseLeave={() => setFlyout(null)}
              >
                <Link
                  href={`/product-category/${category.slug}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-ink hover:bg-haze"
                >
                  <span>{decodeEntities(category.name)}</span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    {category.count}
                    {children.length > 0 && (
                      <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                </Link>
                {children.length > 0 && flyout === category.id && (
                  <div className="absolute left-full top-0 z-50 w-56 rounded-xl border border-line bg-white p-3 shadow-xl">
                    {children.map((child) => (
                      <Link
                        key={child.id}
                        href={`/product-category/${child.slug}`}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-ink hover:bg-haze"
                      >
                        <span>{decodeEntities(child.name)}</span>
                        <span className="text-xs text-muted">{child.count}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <div className="my-1 h-px bg-line" />
          <Link
            href="/categories"
            className="block rounded-lg px-3 py-2 text-sm font-semibold"
            style={{ color: BLUE }}
          >
            All departments →
          </Link>
        </div>
      )}
    </div>
  );
}

interface EServicesDropdownProps {}

export function EServicesDropdown({}: EServicesDropdownProps) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex cursor-default items-center gap-1 rounded px-3 py-2 text-sm font-medium text-ink hover:bg-white"
      >
        E-Services
        <svg viewBox="0 0 24 24" className="size-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 w-56 rounded-xl border border-line bg-white p-3 shadow-xl">
          {[
            { label: "FAQ", href: "/faq" },
            { label: "Contact us", href: "/contact" },
            { label: "Delivery info", href: "/faq" },
            { label: "Returns", href: "/contact" },
            { label: "My account", href: WP.account },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-haze"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
