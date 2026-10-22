"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMobileMenu } from "./mobile-menu-context";
import { WP } from "@/lib/site";

const BLUE = "#2060a0";

interface BarItem {
  label: string;
  href?: string;
  action?: "menu";
  icon: React.ReactNode;
}

export function MobileBottomBar() {
  const pathname = usePathname();
  const { setOpen } = useMobileMenu();

  const items: BarItem[] = [
    {
      label: "Categories",
      href: "/categories",
      icon: (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Search",
      action: "menu",
      icon: (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Home",
      href: "/",
      icon: (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Cart",
      href: WP.cart,
      icon: (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path
            d="M4 5h2l2.2 10.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.5L21 8H7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="20" r="1.3" />
          <circle cx="18" cy="20" r="1.3" />
        </svg>
      ),
    },
    {
      label: "Account",
      href: WP.account,
      icon: (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.8 20c1.3-3.4 3.9-5 7.2-5s5.9 1.6 7.2 5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <nav
      aria-label="Quick links"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {items.map((item) => {
          const isActive = item.href ? pathname === item.href : false;
          const content = (
            <>
              <span
                className="grid place-items-center"
                style={{ color: isActive ? BLUE : "currentColor" }}
              >
                {item.icon}
              </span>
              <span
                className="text-[13px] font-medium leading-none"
                style={{ color: isActive ? BLUE : undefined }}
              >
                {item.label}
              </span>
            </>
          );

          const className = `flex flex-col items-center gap-1 py-2.5 text-muted transition ${
            isActive ? "font-semibold" : ""
          }`;

          if (item.action === "menu") {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => setOpen(true)}
                className={className}
              >
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href ?? "/"} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
