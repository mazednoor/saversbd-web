"use client";

import { useRouter } from "next/navigation";

export function SearchForm({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const router = useRouter();

  return (
    <form
      role="search"
      action="/search"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const query = new FormData(form).get("q")?.toString().trim();
        if (!query) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
        (form.elements.namedItem("q") as HTMLInputElement | null)?.blur();
      }}
      className="relative w-full"
    >
      <label htmlFor={`search-${variant}`} className="sr-only">
        Search products
      </label>
      <input
        id={`search-${variant}`}
        name="q"
        type="search"
        placeholder="Search diapers, skincare, toys…"
        autoComplete="off"
        className="h-11 w-full rounded-full border border-line bg-haze pl-11 pr-32 text-sm text-ink placeholder:text-muted/80 focus:border-brand focus:bg-white focus:outline-none"
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <button
        type="submit"
        className="absolute right-1.5 top-1.5 h-8 rounded-full bg-brand px-8 text-xs font-semibold text-white hover:bg-brand-dark"
      >
        Search
      </button>
    </form>
  );
}
