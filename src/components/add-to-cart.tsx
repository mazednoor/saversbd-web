"use client";

import { useState } from "react";
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
  const selected = variations.find((variation) => String(variation.id) === variationId);
  const canBuy = !hasOptions || Boolean(selected?.inStock && selected.purchasable);

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
      <div className="space-y-2">
        <a href={permalink} className="btn btn-primary w-full">
          Choose options in store
        </a>
        <p className="text-xs text-muted">This product has variants — pick them in the store, then check out.</p>
      </div>
    );
  }

  const addToCart = `/api/cart/add?id=${productId}&quantity=${quantity}${selected ? `&variation=${selected.id}` : ""}`;
  const buyNow = `${addToCart}&buy=1`;

  return (
    <div className="space-y-3">
      {hasOptions ? (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-ink" htmlFor={`variation-${productId}`}>
            Choose an option
          </label>
          <select id={`variation-${productId}`} value={variationId}
            onChange={(event) => { setVariationId(event.target.value); setQuantity(1); }}
            className="h-12 w-full rounded-xl border border-line bg-white px-3 text-base text-ink focus:outline-brand"
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
          disabled={quantity <= 1}
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
        >
          +
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {canBuy ? <><a href={addToCart} className="btn btn-ink h-12 w-full">
          Add to Cart
        </a>
        <a href={buyNow} className="btn btn-primary h-12 w-full">
          Buy Now
        </a></>
        : <><button type="button" disabled className="btn btn-ink h-12 w-full opacity-40">Add to Cart</button>
          <button type="button" disabled className="btn btn-primary h-12 w-full opacity-40">Buy Now</button></>}
      </div>

      <p className="text-xs text-muted">
        Continue to our secure checkout — cash on delivery available.
      </p>
    </div>
  );
}
