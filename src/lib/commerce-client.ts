"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { StoreCart } from "./commerce-types";
import { stripTags } from "./format";

export class ShopError extends Error {
  constructor(message: string, public code = "request_failed", public status = 0) { super(message); }
}
export async function shopRequest<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
  } catch { throw new ShopError("The connection was interrupted. Check your cart or order status before trying again.", "connection_interrupted"); }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new ShopError(stripTags(result?.message ?? "Unable to process this request."), result?.code, response.status);
  if (!result) throw new ShopError("The store returned an invalid response.");
  return result as T;
}

let loading: Promise<StoreCart> | undefined;
let initialized = false;
function announce(cart: StoreCart) { window.dispatchEvent(new CustomEvent("saversbd:cart", { detail: cart })); }
export function loadCart(): Promise<StoreCart> {
  if (!loading) loading = shopRequest<StoreCart>("/api/commerce/cart").then((cart) => {
    initialized = true; announce(cart); return cart;
  }).finally(() => { loading = undefined; });
  return loading;
}
export async function cartAction(action: string, data: Record<string, unknown> = {}): Promise<StoreCart> {
  // A first-load header request must finish setting the session cookie before any mutation.
  if (loading || !initialized) await loadCart();
  const cart = await shopRequest<StoreCart>("/api/commerce/cart", { action, data });
  announce(cart); return cart;
}
export async function resetCart() {
  await shopRequest("/api/commerce/cart", { action: "reset-session" });
  initialized = false; return loadCart();
}
export function useCart() {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [error, setError] = useState<ShopError | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const load = useCallback(async () => {
    try { setCart(await loadCart()); setError(null); } catch (e) { setError(e instanceof ShopError ? e : new ShopError("Unable to load your cart.")); }
  }, []);
  useEffect(() => {
    void load();
    const changed = (event: Event) => { setCart((event as CustomEvent<StoreCart>).detail); setError(null); };
    window.addEventListener("saversbd:cart", changed);
    return () => window.removeEventListener("saversbd:cart", changed);
  }, [load]);
  async function change(action: string, data: Record<string, unknown>) {
    if (lock.current) return null;
    lock.current = true; setBusy(true); setError(null);
    try { const next = await cartAction(action, data); setCart(next); return next; }
    catch (e) { setError(e instanceof ShopError ? e : new ShopError("Unable to update your cart.")); return null; }
    finally { lock.current = false; setBusy(false); }
  }
  return { cart, error, busy, change, load, setError };
}
