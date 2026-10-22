import type { StorePrice } from "./woo";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  times: "×",
  taka: "৳",
};

/** WordPress returns entities in titles/excerpts (e.g. &#8211;). Decode for React. */
export function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&#(\d+);/g, (_, code: string) => safeCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => safeCodePoint(parseInt(hex, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

function safeCodePoint(value: number): string {
  try {
    return String.fromCodePoint(value);
  } catch {
    return "";
  }
}

export function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export function excerptFrom(html: string, length = 160): string {
  const text = stripTags(html);
  if (text.length <= length) return text;
  return `${text.slice(0, length).replace(/\s+\S*$/, "")}…`;
}

/**
 * Prices arrive as integers in minor units (87500 + minor_unit 2 => 875.00),
 * with the currency symbol configured as a prefix or suffix.
 */
export function formatMoney(amount: string | number | null | undefined, prices: StorePrice): string {
  if (amount == null || amount === "") return "";
  const minor = prices.currency_minor_unit ?? 2;
  const value = Number(amount) / 10 ** minor;
  if (!Number.isFinite(value)) return "";

  const fixed = value.toFixed(minor);
  const [whole, fraction] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, prices.currency_thousand_separator || ",");
  const body = fraction ? `${grouped}${prices.currency_decimal_separator || "."}${fraction}` : grouped;

  return `${prices.currency_prefix ?? ""}${body}${prices.currency_suffix ?? ""}`.trim();
}

export function productPrice(product: { prices: StorePrice; is_in_stock: boolean }): string {
  if (Number(product.prices.price) === 0) return "Contact for price";
  return formatMoney(product.prices.price, product.prices);
}

export function discountPercent(prices: StorePrice): number | null {
  const regular = Number(prices.regular_price);
  const sale = Number(prices.sale_price || prices.price);
  if (!regular || !sale || sale >= regular) return null;
  return Math.round(((regular - sale) / regular) * 100);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** Guarantees a string usable in a URL slug / path segment. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function absoluteUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
