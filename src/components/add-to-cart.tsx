"use client";

import { useState } from "react";

interface AddToCartProps {
  productId: number;
  permalink: string;
  inStock: boolean;
  hasOptions: boolean;
  priceLabel: string;
}

/**
 * The cart lives in WooCommerce, so this hands the shopper over to the
 * WordPress cart with the product and quantity already added. No API keys,
 * no duplicated cart state, payment gateways untouched.
 */
export function AddToCart({ productId, permalink, inStock, hasOptions, priceLabel }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const href = `/api/cart/add?id=${productId}&quantity=${quantity}`;

  if (!inStock) {
    return (
      <div className="rounded-2xl border border-line bg-haze p-4">
        <p className="text-sm font-medium text-ink">Currently sold out</p>
        <a href={permalink} className="mt-1 inline-block text-sm text-brand hover:underline">
          Check availability on saversbd.com →
        </a>
      </div>
    );
  }

  if (hasOptions) {
    return (
      <div className="space-y-2">
        <a href={permalink} className="btn btn-primary w-full">
          Choose options on saversbd.com
        </a>
        <p className="text-xs text-muted">This product has variants — pick them in the store, then check out.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 items-center rounded-full border border-line">
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
        <a href={href} className="btn btn-primary h-12 flex-1">
          Add to cart · {priceLabel}
        </a>
      </div>
      <p className="text-xs text-muted">
        You will finish checkout securely on saversbd.com — cash on delivery available.
      </p>
    </div>
  );
}
