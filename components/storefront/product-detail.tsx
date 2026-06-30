"use client";

import Link from "next/link";

import { CheckoutForm, type FeeInfo } from "@/components/storefront/checkout-form";
import { useLang } from "@/components/storefront/lang-provider";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { formatDZD } from "@/lib/money";
import type { ProductRow } from "@/types/database.types";

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

export function ProductDetail({
  product,
  feeMap,
}: {
  product: ProductRow;
  feeMap: Record<number, FeeInfo>;
}) {
  const { t, lang, dir } = useLang();
  const isAr = lang === "ar";
  const available = product.stock_quantity - product.reserved_quantity;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;

  const title = isAr ? product.name_ar : product.name_fr;
  const subtitle = isAr ? product.name_fr : product.name_ar;
  const description = isAr ? product.description_ar : product.description_fr;

  return (
    <div className="mx-auto max-w-[1280px] px-[clamp(18px,5vw,60px)] py-10">
      <Link href="/collection" className="mb-6 inline-flex items-center gap-2 text-[13.5px] font-semibold text-foreground/55 transition-colors hover:text-foreground">
        <span className="text-[16px]">{dir === "rtl" ? "→" : "←"}</span>
        {t.colPage.back}
      </Link>

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} alt={title} />

        <div className="flex flex-col gap-5">
          <div>
            <h1 className="m-0 font-medium" style={{ fontFamily: SERIF, fontSize: "clamp(28px,4vw,46px)", lineHeight: 1.05, letterSpacing: "-.02em" }}>
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-foreground/55" dir={isAr ? "ltr" : "rtl"} style={{ fontFamily: SERIF, fontSize: 18 }}>
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl font-semibold">{formatDZD(product.price)}</span>
            {onSale && <span className="text-lg text-foreground/45 line-through">{formatDZD(product.compare_at_price!)}</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-foreground/65">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: available > 0 ? "#7BA05B" : "#b4513f" }} />
              {available > 0 ? t.product.inStock : t.product.outOfStock}
            </span>
          </div>

          {description ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/70" dir={isAr ? "rtl" : "ltr"}>
              {description}
            </p>
          ) : null}

          {available > 0 ? (
            <CheckoutForm productId={product.id} price={product.price} deliveryFees={feeMap} />
          ) : (
            <div className="rounded-[20px] border border-foreground/10 bg-muted/40 p-5 text-center text-foreground/60">
              {t.product.outOfStockMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
