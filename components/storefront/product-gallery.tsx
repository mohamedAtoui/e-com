"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { productImageUrl } from "@/lib/images";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const hasImages = images && images.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-xl border bg-muted">
        {hasImages ? (
          <Image
            src={productImageUrl(images[active])}
            alt={alt}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Pas d&apos;image
          </div>
        )}
      </div>

      {hasImages && images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2",
                i === active ? "border-primary" : "border-transparent",
              )}
            >
              <Image
                src={productImageUrl(img)}
                alt={`${alt} ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
