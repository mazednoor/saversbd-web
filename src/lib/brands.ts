import type { StoreProduct } from "./woo";

/**
 * The WooCommerce brand taxonomy on saversbd.com is empty (3 terms, 0
 * products), but the catalogue is full of recognisable brands. These are
 * detected from the product name instead, so a brand page works without
 * anyone having to tag 950 products by hand.
 */
export interface Brand {
  slug: string;
  name: string;
  /** Lowercase phrases matched against the product name (word boundaries). */
  matchers: string[];
}

export const BRANDS: Brand[] = [
  { slug: "cerave", name: "CeraVe", matchers: ["cerave"] },
  { slug: "aveeno", name: "Aveeno", matchers: ["aveeno"] },
  { slug: "cetaphil", name: "Cetaphil", matchers: ["cetaphil"] },
  { slug: "bioderma", name: "Bioderma", matchers: ["bioderma"] },
  { slug: "cavendish-harvey", name: "Cavendish & Harvey", matchers: ["cavendish"] },
  { slug: "lindt", name: "Lindt", matchers: ["lindt"] },
  { slug: "hersheys", name: "Hershey's", matchers: ["hershey"] },
  { slug: "avene", name: "Avène", matchers: ["avene"] },
  { slug: "samyang", name: "Samyang", matchers: ["samyang"] },
  { slug: "kelloggs", name: "Kellogg's", matchers: ["kellogg"] },
  { slug: "heinz", name: "Heinz", matchers: ["heinz"] },
  { slug: "nestle", name: "Nestlé", matchers: ["nestle"] },
  { slug: "kitkat", name: "KitKat", matchers: ["kitkat", "kit kat"] },
  { slug: "gerber", name: "Gerber", matchers: ["gerber"] },
  { slug: "dove", name: "Dove", matchers: ["dove"] },
  { slug: "molfix", name: "Molfix", matchers: ["molfix"] },
  { slug: "garnier", name: "Garnier", matchers: ["garnier"] },
  { slug: "pringles", name: "Pringles", matchers: ["pringles"] },
  { slug: "tiffany", name: "Tiffany", matchers: ["tiffany"] },
  { slug: "paco-rabanne", name: "Paco Rabanne", matchers: ["paco rabanne"] },
  { slug: "cosrx", name: "COSRX", matchers: ["cosrx"] },
  { slug: "bounty", name: "Bounty", matchers: ["bounty"] },
  { slug: "galaxy", name: "Galaxy", matchers: ["galaxy"] },
  { slug: "kinder", name: "Kinder", matchers: ["kinder"] },
  { slug: "ritter-sport", name: "Ritter Sport", matchers: ["ritter sport", "ritter"] },
  { slug: "loacker", name: "Loacker", matchers: ["loacker"] },
  { slug: "calvin-klein", name: "Calvin Klein", matchers: ["calvin klein"] },
  { slug: "chupa-chups", name: "Chupa Chups", matchers: ["chupa chups"] },
  { slug: "mamaearth", name: "Mamaearth", matchers: ["mamaearth"] },
  { slug: "elizabeth-arden", name: "Elizabeth Arden", matchers: ["elizabeth arden"] },
  { slug: "enchanteur", name: "Enchanteur", matchers: ["enchanteur"] },
  { slug: "mentos", name: "Mentos", matchers: ["mentos"] },
  { slug: "mars", name: "Mars", matchers: ["mars"] },
  { slug: "boots", name: "Boots", matchers: ["boots"] },
  { slug: "herbal-essences", name: "Herbal Essences", matchers: ["herbal essences"] },
  { slug: "celebrations", name: "Celebrations", matchers: ["celebrations"] },
  { slug: "nongshim", name: "Nongshim", matchers: ["nongshim"] },
  { slug: "snickers", name: "Snickers", matchers: ["snickers"] },
  { slug: "twix", name: "Twix", matchers: ["twix"] },
  { slug: "elit", name: "Elit", matchers: ["elit"] },
  { slug: "beauty-of-joseon", name: "Beauty of Joseon", matchers: ["beauty of joseon"] },
  { slug: "nivea", name: "Nivea", matchers: ["nivea"] },
  { slug: "merci", name: "Merci", matchers: ["merci"] },
];

/** Lowercases a product name and strips the HTML entities WooCommerce adds. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&#8217;|&#039;|&rsquo;/g, "'")
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^a-z0-9&' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const MATCHERS = BRANDS.map((brand) => ({
  brand,
  patterns: brand.matchers.map(
    (matcher) =>
      new RegExp(
        `(^|[^a-z0-9])${matcher.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`,
        "i",
      ),
  ),
}));

/** Returns the brand a product belongs to, or null. */
export function matchBrand(name: string): Brand | null {
  const normalized = normalizeName(name);
  if (!normalized) return null;

  for (const { brand, patterns } of MATCHERS) {
    if (patterns.some((pattern) => pattern.test(normalized))) return brand;
  }
  return null;
}

export function getBrand(slug: string): Brand | null {
  return BRANDS.find((brand) => brand.slug === slug) ?? null;
}

export interface BrandSummary {
  slug: string;
  name: string;
  count: number;
  image: string | null;
  product: StoreProduct | null;
}

/** Groups the catalogue into brands, largest first. */
export function buildBrands(products: StoreProduct[]): BrandSummary[] {
  const buckets = new Map<string, StoreProduct[]>();

  for (const product of products) {
    const brand = matchBrand(product.name);
    if (!brand) continue;
    const list = buckets.get(brand.slug) ?? [];
    list.push(product);
    buckets.set(brand.slug, list);
  }

  return BRANDS.map((brand) => {
    const list = buckets.get(brand.slug) ?? [];
    const cover = list.find((product) => product.images?.length) ?? null;
    return {
      slug: brand.slug,
      name: brand.name,
      count: list.length,
      image: cover?.images?.[0]?.src ?? null,
      product: cover,
    };
  })
    .filter((brand) => brand.count > 0)
    .sort((a, b) => b.count - a.count);
}

/** All products belonging to a brand. */
export function productsForBrand(products: StoreProduct[], slug: string): StoreProduct[] {
  return products.filter((product) => matchBrand(product.name)?.slug === slug);
}
