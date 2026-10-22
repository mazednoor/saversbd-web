import { REVALIDATE, WP_URL } from "./site";

export type WPRendered = { rendered: string; protected?: boolean };

export interface WPPost {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: WPRendered;
  excerpt: WPRendered;
  content: WPRendered;
  featured_media: number;
  categories: number[];
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text: string; media_details?: { width: number; height: number } }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string; taxonomy: string }>>;
  };
}

export interface WPPage {
  id: number;
  slug: string;
  parent: number;
  link: string;
  title: WPRendered;
  content: WPRendered;
  featured_media: number;
  _embedded?: WPPost["_embedded"];
}

export interface WPTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
  description: string;
  parent: number;
}

class WordPressError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = "WordPressError";
  }
}

async function wpFetch<T>(path: string, revalidate = REVALIDATE): Promise<{ data: T; headers: Headers }> {
  const url = `${WP_URL}/wp-json${path}`;
  let res: Response;

  try {
    res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new WordPressError(`Could not reach WordPress at ${WP_URL}`, 0, path);
  }

  if (!res.ok) {
    throw new WordPressError(`WordPress returned ${res.status} for ${path}`, res.status, path);
  }

  return { data: (await res.json()) as T, headers: res.headers };
}

/** Returns null instead of throwing — used by pages that should 404 gracefully. */
export async function wpFetchSafe<T>(path: string, revalidate = REVALIDATE): Promise<T | null> {
  try {
    const { data } = await wpFetch<T>(path, revalidate);
    return data;
  } catch {
    return null;
  }
}

const postFields = "id,slug,date,modified,link,title,excerpt,content,featured_media,categories,_links,_embedded";

export async function getPosts({ page = 1, perPage = 9, search, categoryId } = {} as {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: number;
}) {
  const params = new URLSearchParams({
    _embed: "1",
    _fields: postFields,
    page: String(page),
    per_page: String(perPage),
    orderby: "date",
    order: "desc",
  });
  if (search) params.set("search", search);
  if (categoryId) params.set("categories", String(categoryId));

  try {
    const { data, headers } = await wpFetch<WPPost[]>(`/wp/v2/posts?${params}`);
    return {
      posts: data,
      total: Number(headers.get("x-wp-total") ?? data.length),
      totalPages: Number(headers.get("x-wp-totalpages") ?? 1),
    };
  } catch {
    return { posts: [] as WPPost[], total: 0, totalPages: 0 };
  }
}

export async function getPostBySlug(slug: string): Promise<WPPost | null> {
  const posts = await wpFetchSafe<WPPost[]>(
    `/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed=1&_fields=${postFields}`,
  );
  return posts?.[0] ?? null;
}

export async function getPageBySlug(slug: string): Promise<WPPage | null> {
  const pages = await wpFetchSafe<WPPage[]>(
    `/wp/v2/pages?slug=${encodeURIComponent(slug)}&_embed=1&_fields=${postFields}`,
  );
  return pages?.[0] ?? null;
}

/** All pages are cheap to fetch (a dozen or so) and let us resolve nested paths. */
export async function getAllPages(): Promise<WPPage[]> {
  return (
    (await wpFetchSafe<WPPage[]>(
      `/wp/v2/pages?per_page=100&_embed=1&_fields=id,slug,parent,link,title,content,featured_media`,
    )) ?? []
  );
}

/**
 * Resolves /shop-by-department/toys by walking the parent chain.
 * Works for hierarchical pages, which slugs alone cannot disambiguate.
 */
export async function resolvePageByPath(segments: string[]): Promise<WPPage | null> {
  if (!segments.length) return null;
  const pages = await getAllPages();
  const byId = new Map(pages.map((p) => [p.id, p]));

  // Match on the canonical link path, which is unique and hierarchy-aware.
  const target = `/${segments.join("/")}`;
  return (
    pages.find((page) => {
      try {
        return new URL(page.link).pathname.replace(/\/+$/, "") === target;
      } catch {
        return false;
      }
    }) ??
    pages.find((page) => byId.get(page.id)?.slug === segments[segments.length - 1]) ??
    null
  );
}

export async function getPostCategories(): Promise<WPTerm[]> {
  return (
    (await wpFetchSafe<WPTerm[]>("/wp/v2/categories?per_page=100&hide_empty=true&_fields=id,name,slug,count,description,parent")) ??
    []
  );
}

export async function getSearchResults(query: string) {
  const { posts } = await getPosts({ search: query, perPage: 6 });
  return { posts };
}
