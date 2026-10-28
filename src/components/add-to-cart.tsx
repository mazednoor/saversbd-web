"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cartAction } from "@/lib/commerce-client";
import { decodeEntities, formatMoney } from "@/lib/format";
import type { ProductVariationChoice } from "@/lib/woo";

interface AddToCartProps {
  productId: number;
  permalink: string;
  inStock: boolean;
  hasOptions: boolean;
  priceLabel: string;
  variations?: ProductVariationChoice[];
}

export function AddToCart({ productId, permalink, inStock, hasOptions, priceLabel, variations = [] }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [variationId, setVariationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const router = useRouter();
  const selected = variations.find((variation) => String(variation.id) === variationId);
  const canBuy = !hasOptions || Boolean(selected?.inStock && selected.purchasable);

  async function purchase(buyNow: boolean) {
    if (!canBuy || lock.current) return;
    lock.current = true; setBusy(true); setError("");
    try {
      await cartAction("add-item", { id: productId, quantity, ...(selected ? { variation: selected.id } : {}) });
      router.push(buyNow ? "/checkout" : "/cart");
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to add this item. Check your cart before trying again."); }
    finally { lock.current = false; setBusy(false); }
  }

  if (!inStock) {
    return (
      <div className="rounded-2xl border border-line bg-haze p-4">
        <p className="text-sm font-medium text-ink">Currently sold out</p>
        <a href={permalink} className="mt-1 inline-block text-sm text-brand hover:underline">
          Check availability →
        </a>
      </div>
    );
  }

  if (hasOptions && !variations.length) {
    return (
      <div className="space-y-3 rounded-2xl border border-line bg-haze p-4" role="status">
        <p className="text-sm text-muted">Options for this product are temporarily unavailable. Reload the options or contact us for help.</p>
        <button type="button" onClick={() => router.refresh()} className="btn btn-ink w-full">Reload options</button>
        <Link href="/contact" className="inline-block text-sm text-brand underline">Ask about this product</Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasOptions ? (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-ink" htmlFor={`variation-${productId}`}>
            Choose an option
          </label>
          <select id={`variation-${productId}`} value={variationId}
            onChange={(event) => { setVariationId(event.target.value); setQuantity(1); }}
            disabled={busy} className="h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink focus:outline-brand"
            aria-describedby={`variation-status-${productId}`}>
            <option value="">Select an option</option>
            {variations.map((variation) => (
              <option key={variation.id} value={variation.id}>
                {decodeEntities(variation.label)}{!variation.inStock ? " — Out of stock" : !variation.purchasable ? " — Unavailable" : ""}
              </option>
            ))}
          </select>
          <div id={`variation-status-${productId}`} aria-live="polite" className="text-sm text-muted">
            {selected ? <><p className="text-2xl font-bold text-ink">{formatMoney(selected.prices.price, selected.prices)}</p>
              <p>{!selected.inStock ? "This option is out of stock." : !selected.purchasable ? "This option is unavailable." : "In stock — ready to ship"}</p></>
              : "Select an option to see its price and availability."}
          </div>
        </div>
      ) : null}
      <div className="flex h-12 w-max items-center rounded-full border border-line">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="grid size-11 place-items-center rounded-full text-lg text-muted hover:text-ink disabled:opacity-40"
          disabled={busy || quantity <= 1}
          aria-label="Decrease quantity"
        >
          −
        </button>
        <span aria-live="polite" className="w-8 text-center text-sm font-semibold">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(20, q + 1))}
          className="grid size-11 place-items-center rounded-full text-lg text-muted hover:text-ink"
          aria-label="Increase quantity"
          disabled={busy || quantity >= 20}
        >
          +
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {canBuy ? <><button type="button" disabled={busy} onClick={() => void purchase(false)} className="btn btn-ink h-12 w-full disabled:opacity-40">
          {busy ? "Adding…" : "Add to Cart"}
        </button>
        <button type="button" disabled={busy} onClick={() => void purchase(true)} className="btn btn-primary h-12 w-full disabled:opacity-40">
          Buy Now
        </button></>
        : <><button type="button" disabled className="btn btn-ink h-12 w-full opacity-40">Add to Cart</button>
          <button type="button" disabled className="btn btn-primary h-12 w-full opacity-40">Buy Now</button></>}
      </div>
      {error && <p role="alert" className="text-sm text-red-700">{error} <Link href="/cart" className="underline">View cart</Link></p>}

      <p className="text-xs text-muted">
        Continue to our secure checkout — cash on delivery available.
      </p>
    </div>
  );
}
