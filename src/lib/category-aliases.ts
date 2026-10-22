/**
 * Categories that were merged away during the 2026 taxonomy cleanup.
 *
 * WordPress keeps the old term (and its products) pointing at the new one,
 * but the slug changes — so the old storefront URLs must still resolve.
 * Each alias redirects permanently to the category that absorbed it.
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  // Duplicate labels
  creams: "cream",
  "cream-moisturizers": "cream",
  "face-wash": "facewash",
  "face-cleansers": "facewash",
  "hair-care-2": "hair-care",
  "hair-care-3": "hair-care",
  "shampoo-2": "shampoo",
  "masks-peels": "face-mask",
  "mask-peels": "face-mask",
  "moisturizing-cream": "moisturising-cream",
  "moisturising-care": "moisturising-cream",
  "daily-moisturizing": "moisturizer",

  // Over-specific or near-empty duplicates
  gel: "moisturizer-gel",
  "foaming-gel": "cleansing-gel",
  scrubs: "scrubs-exfoliants",
  "facial-scrub": "scrubs-exfoliants",
  body: "body-care",
  "body-bath": "body-care",
  "loofahs-sponges": "body-care",
  "body-spray": "body-mist-spray",
  "shower-gels-body-wash": "body-wash",
  "bath-shower": "bath-time",
  "bath-skin": "bath-time",
  skin: "skin-care",
  "oil-contro": "oil-control",
  "men-care": "personal-care",
  baby: "baby-care",
  "baby-wash-shampoo": "baby-shampoo",
  "imported-diapers": "baby-diapers",
  bioderma: "skin-care",
};
