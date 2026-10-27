"use client";

import { useState } from "react";

/** Use the brand name as a readable fallback if a logo is missing or unavailable. */
export function BrandLogo({ name, src }: { name: string; src?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-24 w-full items-center justify-center rounded-xl bg-white px-3 py-4 sm:h-28">
      {src && !failed ? (
        // The Commons original is used directly so its SVG and PNG assets remain intact.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="max-h-full max-w-full object-contain transition duration-300 group-hover:scale-105" />
      ) : (
        <span aria-hidden="true" className="text-center text-base font-bold leading-tight text-ink">{name}</span>
      )}
    </span>
  );
}
