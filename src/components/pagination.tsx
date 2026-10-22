import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  params?: Record<string, string | undefined>;
}

function hrefFor(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Compact page list: 1 … 4 5 [6] 7 8 … 40 */
function pageWindow(current: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= total - 2) [total - 1, total - 2, total - 3].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];
  sorted.forEach((page, index) => {
    if (index > 0 && page - (sorted[index - 1] as number) > 1) result.push("gap");
    result.push(page);
  });
  return result;
}

export function Pagination({ currentPage, totalPages, basePath, params = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {currentPage > 1 ? (
        <Link
          href={hrefFor(basePath, params, currentPage - 1)}
          rel="prev"
          className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
        >
          Previous
        </Link>
      ) : null}

      {pageWindow(currentPage, totalPages).map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefFor(basePath, params, item)}
            aria-current={item === currentPage ? "page" : undefined}
            className={
              item === currentPage
                ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
            }
          >
            {item}
          </Link>
        ),
      )}

      {currentPage < totalPages ? (
        <Link
          href={hrefFor(basePath, params, currentPage + 1)}
          rel="next"
          className="rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ink"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
