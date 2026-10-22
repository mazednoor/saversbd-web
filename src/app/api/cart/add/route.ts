import { NextResponse } from "next/server";
import { WP_URL } from "@/lib/site";

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
  const quantity = Math.min(20, Math.max(1, Number(url.searchParams.get("quantity")) || 1));
  const buyNow = url.searchParams.get("buy") === "1";

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.redirect(new URL("/shop", request.url), 302);
  }

  const target = new URL(WP_URL);
  target.searchParams.set("add-to-cart", String(id));
  target.searchParams.set("quantity", String(quantity));
  if (buyNow) target.searchParams.set("buy_now", "1");

  return NextResponse.redirect(target.toString(), 302);
}
