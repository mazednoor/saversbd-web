"use client";
import { useEffect, useState } from "react";
import { loadCart } from "@/lib/commerce-client";
import type { StoreCart } from "@/lib/commerce-types";
export function CartCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    void loadCart().then((cart) => { if (active) setCount(cart.items_count); }).catch(() => undefined);
    const changed = (event: Event) => setCount((event as CustomEvent<StoreCart>).detail.items_count);
    window.addEventListener("saversbd:cart", changed);
    return () => { active = false; window.removeEventListener("saversbd:cart", changed); };
  }, []);
  if (count === null || count === 0) return null;
  return <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white" aria-label={`${count} items in cart`}>{count > 99 ? "99+" : count}</span>;
}
