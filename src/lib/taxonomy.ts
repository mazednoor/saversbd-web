import type { StoreCategory } from "./woo";

/**
 * Curated storefront taxonomy.
 *
 * The WooCommerce category tree is messy: ~82 of the 125 categories sit at the
 * top level, many of them leaf categories (Cream, Lotion, Face, Facewash…)
 * that really belong under a department, and there are near-duplicates
 * (Creams/Cream, Hair Care/Hair care, Masks & Peels/Mask & Peels).
 *
 * This file defines the shape we show to shoppers:
 *
 *   Department (7)  →  Group  →  WooCommerce category (real, linkable)
 *
 * Every raw category slug must appear in exactly one group, except the
 * `uncategorized` bucket, which is a WordPress default and is not shoppable.
 */

export interface TaxonomyGroup {
  name: string;
  slugs: string[];
}

export interface TaxonomyDepartment {
  key: string;
  name: string;
  catchy: string;
  /** Representative category — used for the department "featured" link. */
  anchor?: string;
  groups: TaxonomyGroup[];
}

export const DEPARTMENTS: TaxonomyDepartment[] = [
  {
    key: "skincare-beauty",
    name: "Skincare & Beauty",
    catchy: "Glow Up Daily",
    anchor: "beauty-skincare",
    groups: [
      {
        name: "Skin Care",
        slugs: [
          "skin-care",
          "serums",
          "sensitive-skin",
          "skin-lightening",
          "acne-treament",
          "dry-skin",
          "natural",
          "pore-care",
          "oil-control",
          "skin-relief",
          "soothing",
        ],
      },
      {
        name: "Face Care",
        slugs: [
          "face",
          "facewash",
          "cleanser",
          "cleanser-water",
          "cleansing-gel",
          "cleansing-milk",
          "cleansing-oil-cleanser",
          "micellar-water",
          "foaming-oil",
          "makeup",
          "eye-care",
          "eye-repair",
          "face-mask",
          "face-serum",
          "facial-oil",
        ],
      },
      {
        name: "Creams & Moisturisers",
        slugs: [
          "cream",
          "lotion",
          "lotions-creams",
          "face-cream",
          "day-night-cream",
          "day-cream",
          "night-cream",
          "moisturizer",
          "moisturising-cream",
          "moisturizer-gel",
          "nourishing-cream",
          "repairing-and-protective-cream",
          "ultra-nourishing-balm",
          "ultra-nourishing-cream",
          "ultra-soothing-balm",
          "body-cream",
          "body-lotion",
        ],
      },
      {
        name: "Body Care & Bath",
        slugs: [
          "body-care",
          "body-wash",
          "body-mist-spray",
          "bath-time",
          "shower-cream",
          "scrubs-exfoliants",
        ],
      },
      {
        name: "Sun Protection",
        slugs: ["sun-care", "sun-protection", "sunscreen", "cold-protection"],
      },
      {
        name: "Personal Care",
        slugs: ["personal-care"],
      },
    ],
  },
  {
    key: "hair-care",
    name: "Hair Care",
    catchy: "Healthy Hair, Easy",
    anchor: "hair-care",
    groups: [
      { name: "Shampoo", slugs: ["shampoo"] },
      { name: "Conditioner", slugs: ["conditioner"] },
      {
        name: "Styling & Treatment",
        slugs: ["hair-oil", "hair-mask", "hair-color"],
      },
    ],
  },
  {
    key: "baby-mother",
    name: "Baby & Mother",
    catchy: "Little Ones Love",
    anchor: "baby-care",
    groups: [
      {
        name: "Baby Essentials",
        slugs: ["baby-care", "baby-products", "baby-body-care", "baby-skin", "mom-baby"],
      },
      { name: "Diapers", slugs: ["baby-diapers"] },
      {
        name: "Bath & Skin",
        slugs: ["baby-bath-wash", "baby-oil", "baby-shampoo", "baby-lotion"],
      },
    ],
  },
  {
    key: "deodorants-fragrance",
    name: "Deodorants & Fragrance",
    catchy: "Stay Fresh All Day",
    anchor: "deodorant-stick",
    groups: [
      { name: "Deodorants", slugs: ["deodorant", "deodorant-stick", "deodorants-roll-ons"] },
      {
        name: "Fragrance",
        slugs: ["perfume", "for-her", "for-him"],
      },
    ],
  },
  {
    key: "toys-play",
    name: "Toys & Play",
    catchy: "Playtime Picks",
    anchor: "toys",
    groups: [
      { name: "By Age", slugs: ["0-12m", "12-month-36-month", "3-year-6-year", "6-year-plus"] },
      {
        name: "By Type",
        slugs: [
          "board-games",
          "home-play-activities",
          "kitchen-sets",
          "learning-educational-toys",
          "musical-toys",
          "piano-keyboards",
          "best-multifunctional-toys",
        ],
      },
    ],
  },
  {
    key: "health-grooming",
    name: "Health & Grooming",
    catchy: "Care Essentials",
    anchor: "health-support",
    groups: [
      { name: "Health Support", slugs: ["health-support", "baby-health"] },
      { name: "Grooming", slugs: ["trimmer", "relaxing-oil"] },
    ],
  },
  {
    key: "food-snacks",
    name: "Food & Snacks",
    catchy: "Sweet Treats",
    anchor: "chocolate",
    groups: [{ name: "Snacks", slugs: ["chocolate"] }],
  },
];

export interface ResolvedGroup {
  name: string;
  count: number;
  href: string;
  categoryIds: number[];
  categories: StoreCategory[];
}

export interface ResolvedDepartment {
  key: string;
  name: string;
  catchy: string;
  count: number;
  href: string;
  categoryIds: number[];
  anchor: StoreCategory | null;
  groups: ResolvedGroup[];
}

function sumCounts(categories: StoreCategory[]): number {
  return categories.reduce((total, category) => total + category.count, 0);
}

/** Builds a shop link for a set of categories. */
function shopHref(categories: StoreCategory[]): string {
  const slugs = categories.map((category) => category.slug);
  return `/shop?category=${slugs.join(",")}`;
}

/**
 * Resolves the curated departments against the live WooCommerce categories so
 * counts, links and images always match the shop data.
 */
export function buildTaxonomy(categories: StoreCategory[]): ResolvedDepartment[] {
  const bySlug = new Map(categories.map((category) => [category.slug, category]));

  return DEPARTMENTS.map((department) => {
    const groups = department.groups
      .map((group) => {
        const resolved = group.slugs
          .map((slug) => bySlug.get(slug))
          .filter((category): category is StoreCategory => Boolean(category));
        return {
          name: group.name,
          count: sumCounts(resolved),
          href: shopHref(resolved),
          categoryIds: resolved.map((category) => category.id),
          categories: resolved,
        };
      })
      .filter((group) => group.categories.length > 0);

    const all = groups.flatMap((group) => group.categories);
    const unique = Array.from(new Map(all.map((category) => [category.id, category])).values());

    return {
      key: department.key,
      name: department.name,
      catchy: department.catchy,
      count: sumCounts(unique),
      href: shopHref(unique),
      categoryIds: unique.map((category) => category.id),
      anchor: department.anchor ? bySlug.get(department.anchor) ?? null : null,
      groups,
    };
  }).filter((department) => department.groups.length > 0);
}

/** Finds the department and group a WooCommerce category belongs to. */
export function findPlacement(
  taxonomy: ResolvedDepartment[],
  slug: string,
): { department: ResolvedDepartment; group: ResolvedGroup } | null {
  for (const department of taxonomy) {
    for (const group of department.groups) {
      if (group.categories.some((category) => category.slug === slug)) {
        return { department, group };
      }
    }
  }
  return null;
}
