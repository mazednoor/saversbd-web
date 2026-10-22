import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  description,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-2xl font-bold text-ink md:text-[28px]">{title}</h2>
        {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="text-sm font-semibold text-ink underline-offset-4 hover:text-brand hover:underline">
          {linkLabel} →
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  actionHref = "/shop",
  actionLabel = "Browse products",
}: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-haze px-6 py-16 text-center">
      <h2 className="text-xl font-semibold text-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{message}</p>
      <Link href={actionHref} className="btn btn-ink mt-6">
        {actionLabel}
      </Link>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-line">
          <div className="aspect-square bg-mist" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-1/3 rounded bg-mist" />
            <div className="h-4 w-4/5 rounded bg-mist" />
            <div className="h-4 w-1/2 rounded bg-mist" />
          </div>
        </div>
      ))}
    </div>
  );
}
