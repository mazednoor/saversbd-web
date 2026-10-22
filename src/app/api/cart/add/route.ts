import { NextResponse } from "next/server";
import { WP_URL } from "@/lib/site";

/**
 * Hands the shopper to WooCommerce with the item already in the cart.
 * Keeping the cart in WordPress means taxes, shipping rules, coupons and
 * payment gateways keep working exactly as they do today.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = Number(url.searchParams.get("id"));
  const quantity = Math.min(20, Math.max(1, Number(url.searchParams.get("quantity")) || 1));

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.redirect(new URL("/shop", request.url), 302);
  }

  return NextResponse.redirect(`${WP_URL}/?add-to-cart=${id}&quantity=${quantity}`, 302);
}
