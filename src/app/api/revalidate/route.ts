import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Call this from WordPress right after a product/post is saved so the
 * Next.js cache refreshes immediately instead of waiting for ISR.
 *
 *   POST https://frontend.example.com/api/revalidate?secret=...&path=/shop
 *
 * Tip: add a "save_post" hook in a small must-use plugin (see README).
 */
export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const url = new URL(request.url);

  if (!secret) {
    return NextResponse.json({ error: "REVALIDATE_SECRET is not configured" }, { status: 501 });
  }

  if (url.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const path = url.searchParams.get("path") ?? "/";
  revalidatePath(path === "*" ? "/" : path, path === "*" ? "layout" : "page");

  return NextResponse.json({ revalidated: true, path, now: Date.now() });
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
