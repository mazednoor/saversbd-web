import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCategories, getProducts } from "@/lib/woo";
import { getAllPages, getPosts } from "@/lib/wp";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/shop",
    "/categories",
    "/blog",
    "/search",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  // Products: the Store API caps pages at 100 items.
  const products: MetadataRoute.Sitemap = [];
  const first = await getProducts({ perPage: 100, page: 1 });

  if (first.products.length) {
    products.push(
      ...first.products.map((product) => ({
        url: `${SITE_URL}/product/${product.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    );

    const remainingPages = Math.min(first.totalPages, 12);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, remainingPages - 1) }, (_, index) =>
        getProducts({ perPage: 100, page: index + 2 }),
      ),
    );
    for (const page of rest) {
      products.push(
        ...page.products.map((product) => ({
          url: `${SITE_URL}/product/${product.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        })),
      );
    }
  }

  const categories = (await getCategories())
    .filter((category) => category.count > 0)
    .map((category) => {
      const path = new URL(category.permalink).pathname.replace(/^\/product-category\/|\/$/g, "");
      return {
        url: `${SITE_URL}/product-category/${path}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      };
    });

  const { posts } = await getPosts({ perPage: 100 });
  const blog = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.modified),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const pages = (await getAllPages()).filter((page) => !/^\/(cart|checkout|my-account|order-confirmation)(\/|$)/.test(new URL(page.link).pathname)).map((page) => {
    const path = new URL(page.link).pathname.replace(/\/+$/, "");
    return {
      url: `${SITE_URL}${path}`,
      changeFrequency: "yearly" as const,
      priority: 0.4,
    };
  });

  return [...staticRoutes, ...products, ...categories, ...blog, ...pages];
}
