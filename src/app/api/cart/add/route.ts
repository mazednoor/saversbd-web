import { NextResponse } from "next/server";
import { WP_URL } from "@/lib/site";
import { getProductVariations } from "@/lib/woo";

/**
 * Hands the shopper to WooCommerce with the item already in the cart.
 *
 *   /api/cart/add?id=123&quantity=2          → added, lands on the cart page
 *   /api/cart/add?id=123&quantity=2&buy=1    → added, goes straight to checkout
 *
 * Keeping the cart in WordPress means taxes, shipping rules, coupons and
 * payment gateways keep working exactly as they do today.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const quantityInput = Number(url.searchParams.get("quantity"));
  const quantity = Number.isFinite(quantityInput) ? Math.min(20, Math.max(1, Math.floor(quantityInput))) : 1;
  const buyNow = url.searchParams.get("buy") === "1";

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.redirect(new URL("/shop", request.url), 302);
  }

  const target = new URL(buyNow ? "/checkout/" : "/cart/", WP_URL);
  if (url.searchParams.has("variation")) {
    const variationId = Number(url.searchParams.get("variation"));
    const variation = Number.isSafeInteger(variationId) && variationId > 0
      ? (await getProductVariations(id, true)).find((item) => item.id === variationId)
      : undefined;
    if (!variation || !variation.inStock || !variation.purchasable) {
      return NextResponse.json({ error: "This option is unavailable. Return to the product and choose another option." }, { status: 400 });
    }
    target.searchParams.set("variation_id", String(variation.id));
    for (const [key, value] of Object.entries(variation.attributes)) target.searchParams.set(key, value);
  }
  target.searchParams.set("add-to-cart", String(id));
  target.searchParams.set("quantity", String(quantity));

  return NextResponse.redirect(target.toString(), 302);
}
