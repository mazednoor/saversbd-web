import { NextResponse } from "next/server";
import { decodeEntities, formatMoney } from "@/lib/format";
import { getProducts } from "@/lib/woo";

/**
 * Lightweight product suggestions for the search autosuggest dropdown.
 * Runs server-side so the browser never talks to WooCommerce directly.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const { products } = await getProducts({
      search: query,
      perPage: 8,
      orderby: "popularity",
    });

    const suggestions = products.map((product) => ({
      id: product.id,
      name: decodeEntities(product.name),
      slug: product.slug,
      price:
        Number(product.prices.price) === 0
          ? "Contact for price"
          : formatMoney(product.prices.price, product.prices),
      image: product.images?.[0]?.thumbnail || product.images?.[0]?.src || null,
    }));

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
