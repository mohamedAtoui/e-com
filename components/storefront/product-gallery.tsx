"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { productImageUrl } from "@/lib/images";

/**
 * Amazon-style product gallery:
 * - Desktop (md+): a vertical thumbnail rail on the left (select on hover/click)
 *   next to a large image, with prev/next arrows on hover.
 * - Mobile: a native, swipeable scroll-snap carousel with dot indicators —
 *   swipe left/right to see each view. `dir="ltr"` keeps the swipe math correct
 *   even when the page is in Arabic (RTL).
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const has = images && images.length > 0;
  const many = has && images.length > 1;

  if (!has) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-2xl border border-foreground/10 bg-muted text-foreground/50">
        Pas d&apos;image
      </div>
    );
  }

  const go = (i: number) => setActive((i + images.length) % images.length);

  function scrollToIndex(i: number) {
    const el = scrollRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  function onCarouselScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const i = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    if (i !== active) setActive(i);
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:gap-4">
      {/* Thumbnail rail — desktop only, vertical (Amazon-style) */}
      {many && (
        <div className="hidden max-h-[540px] flex-col gap-2.5 overflow-y-auto pe-1 md:flex">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white transition",
                i === active ? "border-[#2B2724]" : "border-foreground/10 hover:border-foreground/40",
              )}
            >
              <Image src={productImageUrl(img)} alt={`${alt} ${i + 1}`} fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="flex-1">
        {/* Desktop: single large image + hover arrows */}
        <div className="group relative hidden aspect-square overflow-hidden rounded-2xl border border-foreground/10 bg-white md:block">
          <Image
            src={productImageUrl(images[active])}
            alt={alt}
            fill
            priority
            sizes="50vw"
            className="object-contain p-4"
          />
          {many && (
            <>
              <Arrow dir="left" onClick={() => go(active - 1)} />
              <Arrow dir="right" onClick={() => go(active + 1)} />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white">
                {active + 1} / {images.length}
              </span>
            </>
          )}
        </div>

        {/* Mobile: swipeable scroll-snap carousel + dots */}
        <div className="md:hidden">
          <div
            ref={scrollRef}
            onScroll={onCarouselScroll}
            dir="ltr"
            className="flex snap-x snap-mandatory overflow-x-auto rounded-2xl border border-foreground/10 bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, i) => (
              <div key={img} className="relative aspect-square w-full shrink-0 snap-start">
                <Image
                  src={productImageUrl(img)}
                  alt={`${alt} ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-contain p-3"
                />
              </div>
            ))}
          </div>

          {many && (
            <div className="mt-3 flex justify-center gap-1.5">
              {images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  aria-current={i === active}
                  onClick={() => scrollToIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === active ? "w-5 bg-[#2B2724]" : "w-1.5 bg-foreground/25",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Arrow({ dir, onClick }: { dir: "left" | "right"; onClick: () => void }) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "left" ? "Image précédente" : "Image suivante"}
      className={cn(
        "absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-foreground/10 bg-white/85 opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100",
        dir === "left" ? "left-2" : "right-2",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
