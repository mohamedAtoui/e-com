"use client";

import { Star } from "lucide-react";
import Image from "next/image";

import { useLang } from "@/components/storefront/lang-provider";
import { productImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { ProductReviewRow } from "@/types/database.types";

/** Row of 5 stars, filled up to `value` (supports halves via rounding). */
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={cn(
            i <= Math.round(value) ? "fill-[#F4B860] text-[#F4B860]" : "fill-transparent text-foreground/25",
          )}
        />
      ))}
    </span>
  );
}

/** Compact "★★★★★ 4.8 (12 avis)" summary, links down to the reviews section. */
export function RatingSummary({ average, count }: { average: number; count: number }) {
  const { t } = useLang();
  if (count === 0) return null;
  return (
    <a href="#avis" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-75">
      <Stars value={average} />
      <span className="font-semibold">{average.toFixed(1)}</span>
      <span className="text-foreground/55 underline-offset-2 hover:underline">
        {t.product.reviewsCount.replace("{n}", String(count))}
      </span>
    </a>
  );
}

export function ProductReviews({
  reviews,
  average,
}: {
  reviews: ProductReviewRow[];
  average: number;
}) {
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  if (reviews.length === 0) return null;

  return (
    <section id="avis" className="scroll-mt-24 pt-12">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-serif text-[clamp(22px,3vw,30px)] font-medium">{t.product.reviews}</h2>
        <div className="flex items-center gap-2 text-sm">
          <Stars value={average} size={16} />
          <span className="font-semibold">{average.toFixed(1)}</span>
          <span className="text-foreground/55">
            {t.product.reviewsCount.replace("{n}", String(reviews.length))}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {reviews.map((r) => {
          const comment = isAr ? r.comment_ar || r.comment_fr : r.comment_fr || r.comment_ar;
          return (
            <article key={r.id} className="rounded-2xl border border-foreground/10 bg-white/60 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{r.author_name}</p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#3F8F2B]">
                    ✓ {t.product.verifiedBuyer}
                  </span>
                </div>
                <Stars value={r.rating} />
              </div>
              {comment && (
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-foreground/75">{comment}</p>
              )}
              {r.image_path && (
                <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-white">
                  <Image
                    src={productImageUrl(r.image_path)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 340px"
                    className="object-cover"
                  />
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
