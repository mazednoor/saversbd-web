import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-6xl font-bold text-brand">404</p>
      <h1 className="mt-3 text-2xl font-bold text-ink md:text-3xl">We couldn&apos;t find that page</h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The link may be old, or the product might no longer be sold. Try searching or browse the catalogue.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/shop" className="btn btn-primary">
          Browse products
        </Link>
        <Link href="/" className="btn btn-outline">
          Back home
        </Link>
      </div>
    </div>
  );
}
