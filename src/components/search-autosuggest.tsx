"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const BLUE = "#2060a0";

interface Suggestion {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string | null;
}

export function SearchAutosuggest({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("bad response");
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
        setOpen(true);
        setActive(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handlePointer(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, []);

  function navigateToProduct(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/product/${slug}`);
  }

  function submitSearch(value: string) {
    const q = value.trim();
    setOpen(false);
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    inputRef.current?.blur();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) setOpen(true);
      setActive((prev) => Math.min(suggestions.length - 1, prev + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((prev) => Math.max(-1, prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (active >= 0 && suggestions[active]) {
        navigateToProduct(suggestions[active].slug);
      } else {
        submitSearch(query);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  const showDropdown = open && (loading || suggestions.length > 0 || query.trim().length >= 2);

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        action="/search"
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch(query);
        }}
        className="relative w-full"
      >
        <label htmlFor={`search-${variant}`} className="sr-only">
          Search products
        </label>
        <input
          ref={inputRef}
          id={`search-${variant}`}
          name="q"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim().length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
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

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl border border-line bg-white shadow-xl">
          {loading && suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">Searching…</div>
          ) : suggestions.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">
              No matching products. Press Enter to search everything.
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    onClick={() => navigateToProduct(suggestion.slug)}
                    onMouseEnter={() => setActive(index)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2 text-left transition ${
                      index === active ? "bg-haze" : "hover:bg-haze"
                    }`}
                  >
                    {suggestion.image ? (
                      <img
                        src={suggestion.image}
                        alt=""
                        className="size-10 shrink-0 rounded-lg bg-haze object-contain"
                      />
                    ) : (
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-haze text-xs text-muted">
                        No img
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {suggestion.name}
                      </span>
                      <span className="block text-xs text-muted">{suggestion.price}</span>
                    </span>
                  </button>
                </li>
              ))}
              <li className="border-t border-line">
                <button
                  type="button"
                  onClick={() => submitSearch(query)}
                  className="block w-full cursor-pointer px-3 py-2 text-left text-sm font-semibold"
                  style={{ color: BLUE }}
                >
                  See all results for “{query}” →
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
