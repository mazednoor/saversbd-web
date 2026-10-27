"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buildTaxonomy, categoryHref } from "@/lib/taxonomy";
import { decodeEntities } from "@/lib/format";
import { WP } from "@/lib/site";
import type { StoreCategory } from "@/lib/woo";

const BLUE = "#2060a0";

interface AllCategoriesDropdownProps {
  categories: StoreCategory[];
}

export function AllCategoriesDropdown({ categories }: AllCategoriesDropdownProps) {
  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinned = useRef(false);

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const close = () => {
    cancelClose();
    pinned.current = false;
    setOpen(false);
    setDepartment(null);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  const departments = buildTaxonomy(categories);
  const active = departments.find((item) => item.key === department) ?? null;

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={() => {
        cancelClose();
        closeTimer.current = setTimeout(() => {
          if (!pinned.current && !rootRef.current?.contains(document.activeElement)) close();
        }, 250);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (pinned.current) close();
          else { cancelClose(); pinned.current = true; setOpen(true); }
        }}
        aria-expanded={open}
        aria-controls="all-categories-menu"
        className="flex cursor-pointer items-center gap-1.5 rounded px-3 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        style={{ backgroundColor: BLUE }}
      >
        All Categories
        <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div id="all-categories-menu" className="absolute left-0 top-full z-50 w-64 rounded-xl border border-line bg-white p-3 shadow-xl">
          <Link
            href="/categories"
            onClick={close}
            className="mb-1 block rounded-lg px-3 py-2.5 text-[15px] font-semibold"
            style={{ color: BLUE }}
          >
            All departments →
          </Link>
          <div className="my-1 h-px bg-line" />

          {departments.map((item) => (
            <div
              key={item.key}
              className="group/sub relative"
              onMouseEnter={() => setDepartment(item.key)}
              onFocus={() => setDepartment(item.key)}
            >
              <Link
                href={item.landingHref}
                onClick={close}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-haze focus-visible:outline-2 focus-visible:outline-blue-600 ${active?.key === item.key ? "bg-haze" : ""}`}
              >
                <span>{item.name}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  {item.count}
                  <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 6 6 6-6 6" strokeLinecap="round" />
                  </svg>
                </span>
              </Link>

              {active?.key === item.key && (
                /* Transparent padding bridges the gap so the panel stays open
                   while the cursor travels across it, and the panel has no
                   left border so it reads as one continuous surface. */
                <div className="absolute left-full top-0 z-50 pl-[11px]">
                  <div className="max-h-[70vh] w-[30rem] overflow-y-auto rounded-r-xl border-y border-r border-line bg-white p-4 shadow-[10px_0_20px_-12px_rgba(4,0,55,0.45)]">
                    {item.groups.map((group) => (
                      <div key={group.name} className="mb-4 last:mb-0">
                        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                          {group.name}
                        </p>
                        <div className="grid grid-cols-2 gap-x-3">
                          {group.categories.map((category) => (
                            <Link
                              key={category.id}
                              href={categoryHref(category.slug)}
                              onClick={close}
                              className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-[15px] text-ink hover:bg-haze focus-visible:outline-2 focus-visible:outline-blue-600"
                            >
                              <span className="truncate">{decodeEntities(category.name)}</span>
                              <span className="text-xs text-muted">{category.count}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function EServicesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="flex cursor-default items-center gap-1 rounded px-3 py-2 text-[14px] font-medium text-ink hover:bg-white"
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
              className="block rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink hover:bg-haze"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
