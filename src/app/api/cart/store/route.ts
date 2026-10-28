import { NextRequest, NextResponse } from "next/server";
import { WP_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
const COOKIE = "saversbd_cart_token";
const operations = new Set(["add-item", "update-item", "remove-item", "apply-coupon", "remove-coupon"]);

async function forward(req: NextRequest, operation = "", body?: unknown) {
  const token = req.cookies.get(COOKIE)?.value;
  if (operation && !token) return NextResponse.json({ message: "Your cart session expired. Please try again." }, { status: 409 });
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Cart-Token"] = token;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  try {
    const upstream = await fetch(`${WP_URL}/wp-json/wc/store/v1/cart${operation ? `/${operation}` : ""}`, {
      method: operation ? "POST" : "GET", headers, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(12000),
    });
    const data = await upstream.json().catch(() => ({ message: "The cart service returned an invalid response." }));
    const response = NextResponse.json(data, { status: upstream.status, headers: { "Cache-Control": "no-store" } });
    const newToken = upstream.headers.get("Cart-Token");
    if (upstream.ok && newToken) response.cookies.set(COOKIE, newToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 });
    return response;
  } catch {
    return NextResponse.json({ message: "Cart is temporarily unavailable. Please try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(req: NextRequest) { return forward(req); }
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || origin !== req.nextUrl.origin) return NextResponse.json({ message: "Invalid request origin." }, { status: 403 });
  const parsed = await req.json().catch(() => null);
  if (!parsed || typeof parsed !== "object" || !operations.has(parsed.operation) || !parsed.data || typeof parsed.data !== "object") return NextResponse.json({ message: "Invalid cart request." }, { status: 400 });
  return forward(req, parsed.operation, parsed.data);
}
