"use client";

import { useLang } from "@/components/storefront/lang-provider";
import { productImageUrl } from "@/lib/images";
import type { ContentBlock } from "@/types/database.types";

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

/** Amazon-style "A+ content": stacked heading / paragraph / image blocks. */
export function ProductDescription({ blocks }: { blocks: ContentBlock[] }) {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const pick = (fr: string, ar: string) => (isAr ? ar || fr : fr || ar);

  const visible = (blocks ?? []).filter((b) =>
    b.type === "image" ? Boolean(b.src) : Boolean(pick(b.fr, b.ar).trim()),
  );
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-[860px]" dir={isAr ? "rtl" : "ltr"}>
      {visible.map((b, i) => {
        if (b.type === "image") {
          return (
            <div key={i} className="my-7 overflow-hidden rounded-[20px] border border-foreground/10 bg-white/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={productImageUrl(b.src)}
                alt={b.alt}
                loading="lazy"
                className="block h-auto w-full object-contain"
              />
            </div>
          );
        }
        const text = pick(b.fr, b.ar);
        if (b.type === "heading") {
          return (
            <h2
              key={i}
              className="mb-3 mt-10 font-medium"
              style={{ fontFamily: SERIF, fontSize: "clamp(22px,3vw,32px)", lineHeight: 1.15, letterSpacing: "-.01em" }}
            >
              {text}
            </h2>
          );
        }
        return (
          <p key={i} className="my-4 whitespace-pre-line text-[16px] leading-relaxed text-foreground/75">
            {text}
          </p>
        );
      })}
    </section>
  );
}
