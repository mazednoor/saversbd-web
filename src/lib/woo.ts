import { REVALIDATE, WP_URL } from "./site";

/** Public WooCommerce Store API — no keys needed, safe for server components. */
const STORE = `${WP_URL}/wp-json/wc/store/v1`;

export interface StorePrice {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface StoreImage {
  id: number;
  src: string;
  thumbnail: string;
  srcset: string;
  sizes: string;
  name: string;
  alt: string;
}

export interface StoreCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  description: string;
  image: StoreImage | null;
  permalink: string;
}

export interface StoreProduct {
  id: number;
  name: string;
  slug: string;
  parent: number;
  type: string;
  permalink: string;
  sku: string;
  short_description: string;
  description: string;
  on_sale: boolean;
  prices: StorePrice;
  price_html: string;
  average_rating: string;
  review_count: number;
  images: StoreImage[];
  categories: { id: number; name: string; slug: string }[];
  tags: { id: number; name: string; slug: string }[];
  is_in_stock: boolean;
  is_purchasable: boolean;
  has_options: boolean;
  stock_availability?: { text: string; class: string };
  low_stock_remaining: number | null;
}

export interface ProductQuery {
  page?: number;
  perPage?: number;
  category?: number | number[];
  search?: string;
  orderby?: "date" | "modified" | "id" | "title" | "slug" | "price" | "popularity" | "rating" | "menu_order";
  order?: "asc" | "desc";
  onSale?: boolean;
  exclude?: number[];
  include?: number[];
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductResult {
  products: StoreProduct[];
  total: number;
  totalPages: number;
}

async function storeFetch(path: string, revalidate = REVALIDATE): Promise<{ data: unknown; headers: Headers; ok: boolean }> {
  const res = await fetch(`${STORE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate, tags: ["products", "categories"] },
    signal: AbortSignal.timeout(20_000),
  });

  return {
    data: res.ok ? await res.json().catch(() => null) : null,
    headers: res.headers,
    ok: res.ok,
  };
}

function buildProductQuery(q: ProductQuery): string {
  const params = new URLSearchParams();
  params.set("per_page", String(Math.min(q.perPage ?? 24, 100)));
  params.set("page", String(q.page ?? 1));
  if (q.category) {
    const ids = Array.isArray(q.category) ? q.category.join(",") : String(q.category);
    params.set("category", ids);
  }
  if (q.search) params.set("search", q.search);
  if (q.orderby) params.set("orderby", q.orderby);
  if (q.order) params.set("order", q.order);
  if (q.onSale) params.set("on_sale", "true");
  if (q.exclude?.length) params.set("exclude", q.exclude.join(","));
  if (q.include?.length) params.set("include", q.include.join(","));
  if (q.minPrice != null) params.set("min_price", String(q.minPrice));
  if (q.maxPrice != null) params.set("max_price", String(q.maxPrice));
  return params.toString();
}

export async function getProducts(query: ProductQuery = {}): Promise<ProductResult> {
  try {
    const { data, headers, ok } = await storeFetch(`/products?${buildProductQuery(query)}`);
    if (!ok || !Array.isArray(data)) return { products: [], total: 0, totalPages: 0 };
    return {
      products: data as StoreProduct[],
      total: Number(headers.get("x-wp-total") ?? data.length),
      totalPages: Number(headers.get("x-wp-totalpages") ?? 1),
    };
  } catch {
    return { products: [], total: 0, totalPages: 0 };
  }
}

export async function getProductBySlug(slug: string): Promise<StoreProduct | null> {
  try {
    const { data, ok } = await storeFetch(`/products?slug=${encodeURIComponent(slug)}`);
    if (!ok || !Array.isArray(data)) return null;
    return (data as StoreProduct[])[0] ?? null;
  } catch {
    return null;
  }
}

let categoryCache: { at: number; data: StoreCategory[] } | null = null;

/** Fetches every non-empty category (123 on saversbd.com) with heavy caching. */
export async function getCategories(): Promise<StoreCategory[]> {
  if (categoryCache && Date.now() - categoryCache.at < 60_000) return categoryCache.data;

  try {
    const all: StoreCategory[] = [];
    for (let page = 1; page <= 3; page++) {
      const { data, ok, headers } = await storeFetch(
        `/products/categories?per_page=100&page=${page}&hide_empty=true`,
      );
      if (!ok || !Array.isArray(data)) break;
      all.push(...(data as StoreCategory[]));
      if (page >= Number(headers.get("x-wp-totalpages") ?? 1)) break;
    }
    categoryCache = { at: Date.now(), data: all };
    return all;
  } catch {
    return [];
  }
}

export async function getTopCategories(limit = 8): Promise<StoreCategory[]> {
  const categories = await getCategories();
  const withCounts = categories.filter((c) => c.count > 0 && c.slug !== "uncategorized");
  // Top-level categories make the best navigation tiles.
  const top = withCounts.filter((c) => c.parent === 0).sort((a, b) => b.count - a.count);
  return (top.length >= 4 ? top : withCounts.sort((a, b) => b.count - a.count)).slice(0, limit);
}

export async function getCategoryBySlug(slug: string): Promise<StoreCategory | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getChildCategories(parentId: number): Promise<StoreCategory[]> {
  return (await getCategories()).filter((c) => c.parent === parentId && c.count > 0);
}

/**
 * Category tiles need a photo, but WooCommerce category images are unused on
 * this store — so we borrow the image of the category's best-selling product.
 */
export async function getCategoriesWithImages(limit = 8) {
  const categories = await getTopCategories(limit);
  return Promise.all(
    categories.map(async (category) => {
      const { products } = await getProducts({ category: category.id, perPage: 1, orderby: "popularity" });
      return { ...category, productImage: products[0]?.images?.[0]?.src ?? null, productName: products[0]?.name ?? null };
    }),
  );
}

export async function getRelatedProducts(product: StoreProduct, limit = 4): Promise<StoreProduct[]> {
  const primaryCategory = product.categories?.[0];
  const { products } = await getProducts({
    category: primaryCategory?.id,
    perPage: limit + 1,
    orderby: "popularity",
    exclude: [product.id],
  });
  return products.slice(0, limit);
}

/**
 * The whole catalogue (956 products on saversbd.com). Used by the brand
 * pages, which need every product to match names against. Cached for an hour
 * so the extra requests are paid once.
 */
export async function getAllProducts(): Promise<StoreProduct[]> {
  const all: StoreProduct[] = [];
  try {
    for (let page = 1; page <= 12; page++) {
      const { data, ok, headers } = await storeFetch(`/products?per_page=100&page=${page}`, 3600);
      if (!ok || !Array.isArray(data)) break;
      all.push(...(data as StoreProduct[]));
      if (page >= Number(headers.get("x-wp-totalpages") ?? 1)) break;
    }
    return all;
  } catch {
    return all;
  }
}

export async function getStoreCurrency(): Promise<StorePrice | null> {
  const { products } = await getProducts({ perPage: 1 });
  return products[0]?.prices ?? null;
}
