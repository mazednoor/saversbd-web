"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "date-desc", label: "Newest first" },
  { value: "popularity-desc", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "title-asc", label: "Name: A to Z" },
] as const;

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-muted sm:inline">Sort</span>
      <select
        value={value}
        onChange={(event) => {
          const next = new URLSearchParams(params.toString());
          next.set("orderby", event.target.value);
          next.delete("page");
          router.push(`?${next.toString()}`, { scroll: false });
        }}
        className="h-10 rounded-full border border-line bg-white px-4 pr-8 text-sm font-medium text-ink focus:border-ink focus:outline-none"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
