"use client";

import Image from "next/image";
import { useState } from "react";
import type { StoreImage } from "@/lib/woo";

export function ProductGallery({ images, name }: { images: StoreImage[]; name: string }) {
  const [active, setActive] = useState(0);
  const list = images?.length ? images : [];
  const current = list[active];

  if (!current) {
    return <div className="aspect-square w-full rounded-2xl border border-line bg-haze" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-haze">
        <Image
          key={current.src}
          src={current.src}
          alt={current.alt || name}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-6"
        />
      </div>

      {list.length > 1 ? (
        <div className="grid grid-cols-5 gap-2">
          {list.map((image, index) => (
            <button
              key={`${image.id}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${name}`}
              aria-pressed={index === active}
              className={`relative aspect-square overflow-hidden rounded-xl border bg-haze transition ${
                index === active ? "border-brand ring-1 ring-brand" : "border-line hover:border-muted"
              }`}
            >
              <Image src={image.thumbnail || image.src} alt="" fill sizes="120px" className="object-contain p-1.5" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
