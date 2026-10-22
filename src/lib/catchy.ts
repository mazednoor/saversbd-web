import { decodeEntities } from "./format";

/**
 * Short, catchy headlines for the homepage category rows.
 * Keyed by category slug so they stay stable even if WooCommerce renames a
 * category. Anything not listed falls back to "<Category> Favorites".
 */
const TITLES: Record<string, string> = {
  "beauty-skincare": "Glow Up Daily",
  "beauty-and-skincare": "Glow Up Daily",
  face: "Face First",
  cream: "Creamy Classics",
  lotion: "Silky Smooth",
  baby: "Little Ones Love",
  "baby-care": "Made for Mums",
  "baby-products": "Baby's Firsts",
  "baby-bath-wash": "Bath Time Fun",
  "baby-shampoo": "Squeaky Clean",
  "baby-oil": "Soft & Smooth",
  "baby-skin": "Delicate Skin Care",
  "deodorant-stick": "Stay Fresh All Day",
  deodorant: "Stay Fresh All Day",
  "roll-ons": "Stay Fresh All Day",
  perfume: "Signature Scents",
  facewash: "Clean Start",
  "skin-care": "Skin Goals",
  "body-care": "Body Bliss",
  "hair-care": "Healthy Hair, Easy",
  "personal-care": "Everyday Essentials",
  "mom-baby": "Mum & Baby Love",
  "men-care": "Men's Corner",
  "food-supplements": "Daily Nutrition",
  "personal-hygiene": "Fresh & Clean",
  "oral-care": "Bright Smile",
  footwear: "Step in Style",
  "home-living": "Home Sweet Home",
  toys: "Playtime Picks",
  chocolate: "Sweet Treats",
  "health-care": "Health Essentials",
  "medical-supplies": "Care & Recovery",
};

/** Builds a short, catchy headline for a category. */
export function catchyTitle(name: string, slug?: string): string {
  if (slug && TITLES[slug]) return TITLES[slug];

  const clean = decodeEntities(name).trim();
  if (!clean) return "Featured Products";

  // "Bath & Wash" -> "Bath & Wash Favorites"
  return `${clean} Favorites`;
}
