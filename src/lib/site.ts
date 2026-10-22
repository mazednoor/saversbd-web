/**
 * Central site configuration.
 * Everything WordPress-specific is read from env so the same code can be
 * pointed at staging (staging.saversbd.com) or another store later.
 */

export const WP_URL = (process.env.WORDPRESS_URL ?? "https://saversbd.com").replace(/\/+$/, "");

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const REVALIDATE = Number(process.env.NEXT_PUBLIC_REVALIDATE ?? 600);

export const SITE = {
  name: "SaversBD",
  tagline: "Authentic products at unbeatable prices, delivered across Bangladesh.",
  description:
    "Shop authentic baby care, skincare, toys and everyday essentials in Bangladesh. Cash on delivery, 24–48h delivery inside Dhaka.",
  locale: "en_BD",
  currency: "BDT",
} as const;

/** Deep links back to WooCommerce for anything transactional. */
export const WP = {
  shop: `${WP_URL}/shop/`,
  cart: `${WP_URL}/cart/`,
  checkout: `${WP_URL}/checkout/`,
  account: `${WP_URL}/my-account/`,
  search: (query: string) => `${WP_URL}/?s=${encodeURIComponent(query)}&post_type=product`,
  /** Native WooCommerce add-to-cart URL — works without JavaScript. */
  addToCart: (id: number, quantity = 1) =>
    `${WP_URL}/?add-to-cart=${id}${quantity > 1 ? `&quantity=${quantity}` : ""}`,
  product: (permalink: string) => permalink,
};

export const NAV: { label: string; href: string }[] = [
  { label: "Shop", href: "/shop" },
  { label: "Categories", href: "/categories" },
  { label: "Deals", href: "/shop?on_sale=1" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];
