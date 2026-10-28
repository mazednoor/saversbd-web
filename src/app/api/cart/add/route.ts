import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/site";

// Old bookmarked links must not mutate a cart through GET. New purchases use
// the same-origin POST endpoint and retain their session on the frontend.
export function GET() {
  return NextResponse.redirect(new URL("/cart", SITE_URL), {
    status: 302, headers: { "Cache-Control": "private, no-store" },
  });
}
