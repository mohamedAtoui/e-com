"use client";

import Link from "next/link";

import { useLang } from "@/components/storefront/lang-provider";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductRow } from "@/types/database.types";

type GridProduct = Pick<
  ProductRow,
  "slug" | "name_fr" | "name_ar" | "price" | "compare_at_price" | "images" | "stock_quantity" | "reserved_quantity"
>;

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

export function CollectionView({ products }: { products: GridProduct[] }) {
  const { t, dir } = useLang();
  const n = products.length;
  const count = `${n} ${n === 1 ? t.colPage.countOne : t.colPage.countMany}`;

  return (
    <div style={{ fontSize: 17, lineHeight: 1.65 }}>
      <section className="mx-auto max-w-[1280px] px-[clamp(18px,5vw,60px)] pb-[clamp(28px,4vh,44px)] pt-[clamp(44px,7vh,84px)]">
        <Link data-reveal href="/" className="mb-[26px] inline-flex items-center gap-2 text-[13.5px] font-semibold text-foreground/55 transition-colors hover:text-foreground">
          <span className="text-[16px]">{dir === "rtl" ? "→" : "←"}</span>
          {t.colPage.back}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div data-reveal className="mb-4 text-[13px] font-semibold uppercase tracking-[0.2em] text-foreground/50">{t.colPage.kicker}</div>
            <h1 data-reveal data-delay=".05" className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(36px,6vw,82px)", lineHeight: 0.98, letterSpacing: "-.025em" }}>
              {t.colPage.title}
            </h1>
          </div>
          <p data-reveal data-delay=".1" className="m-0 max-w-[24em] text-[15.5px] leading-[1.7] text-foreground/62">{t.colPage.lede}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-[clamp(18px,5vw,60px)] pb-[clamp(70px,9vh,120px)] pt-[clamp(20px,3vh,36px)]">
        <div className="mb-6 text-[13.5px] font-medium text-foreground/50">{count}</div>
        {n === 0 ? (
          <p className="py-16 text-center text-foreground/55">{t.col.empty}</p>
        ) : (
          <div className="grid gap-[clamp(16px,1.8vw,28px)]" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,250px),1fr))" }}>
            {products.map((p) => (
              <div data-reveal key={p.slug}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
