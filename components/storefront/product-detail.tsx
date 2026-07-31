"use client";

import { RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";

import { CheckoutForm, type FeeInfo } from "@/components/storefront/checkout-form";
import { useLang } from "@/components/storefront/lang-provider";
import { ProductCard } from "@/components/storefront/product-card";
import { ProductDescription } from "@/components/storefront/product-description";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductReviews, RatingSummary } from "@/components/storefront/product-reviews";
import { formatDZD } from "@/lib/money";
import { normalizeOffers } from "@/lib/offers";
import type { ProductReviewRow, ProductRow } from "@/types/database.types";

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

type RelatedProduct = Pick<
  ProductRow,
  "slug" | "name_fr" | "name_ar" | "price" | "compare_at_price" | "images" | "stock_quantity" | "reserved_quantity"
>;

export function ProductDetail({
  product,
  feeMap,
  reviews = [],
  related = [],
}: {
  product: ProductRow;
  feeMap: Record<number, FeeInfo>;
  reviews?: ProductReviewRow[];
  related?: RelatedProduct[];
}) {
  const { t, lang, dir } = useLang();
  const isAr = lang === "ar";
  const available = product.stock_quantity - product.reserved_quantity;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;
  const offers = normalizeOffers(product.offers);
  const discount = onSale
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  const title = isAr ? product.name_ar || product.name_fr : product.name_fr || product.name_ar;
  const subtitle = isAr ? product.name_fr : product.name_ar;
  const description = isAr ? product.description_ar : product.description_fr;
  const lowStock = available > 0 && available <= 5;

  const ratingAvg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  const trust = [
    { icon: ShieldCheck, label: t.product.trust.cod },
    { icon: Truck, label: t.product.trust.delivery },
    { icon: RotateCcw, label: t.product.trust.guarantee },
    { icon: Sparkles, label: t.product.trust.quality },
  ];

  return (
    <div className="mx-auto max-w-[720px] px-[clamp(18px,5vw,32px)] pb-28 pt-6 lg:pb-16">
      <Link
        href="/collection"
        className="mb-5 inline-flex items-center gap-2 text-[13.5px] font-semibold text-foreground/55 transition-colors hover:text-foreground"
      >
        <span className="text-[16px]">{dir === "rtl" ? "→" : "←"}</span>
        {t.colPage.back}
      </Link>

      {/* 1 — The product itself */}
      <ProductGallery images={product.images ?? []} alt={title} />

      {/* 2 — Identity + proof + price */}
      <div className="mt-6 space-y-4">
        <div>
          <h1
            className="m-0 font-medium"
            style={{ fontFamily: SERIF, fontSize: "clamp(26px,4.4vw,40px)", lineHeight: 1.08, letterSpacing: "-.02em" }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-foreground/55" dir={isAr ? "ltr" : "rtl"} style={{ fontFamily: SERIF, fontSize: 17 }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <RatingSummary average={ratingAvg} count={reviews.length} />

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-serif text-[36px] font-semibold leading-none">{formatDZD(product.price)}</span>
          {onSale && (
            <>
              <span className="text-lg text-foreground/45 line-through">{formatDZD(product.compare_at_price!)}</span>
              <span className="rounded-full bg-[#2B2724] px-2.5 py-1 text-[12px] font-bold text-[#FAF7F2]">
                −{discount}%
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[12px] font-semibold text-foreground/65">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: available > 0 ? "#7BA05B" : "#b4513f" }} />
            {available > 0 ? t.product.inStock : t.product.outOfStock}
          </span>
          {lowStock && (
            <span className="inline-flex items-center rounded-full bg-[#F4B860]/20 px-3 py-1 text-[12px] font-semibold text-[#9a6a1f]">
              🔥 {t.product.lowStock.replace("{n}", String(available))}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {trust.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.label}
                className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-white/50 px-3 py-2.5 text-[12.5px] font-medium leading-tight"
              >
                <Icon className="size-4 shrink-0 text-primary" />
                <span>{b.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 — Buy. The form sits high on the page, right after price + proof. */}
      <div id="order" className="mt-6 scroll-mt-24">
        {available > 0 ? (
          <CheckoutForm
            productId={product.id}
            price={product.price}
            offers={offers}
            deliveryFees={feeMap}
            image={product.images?.[0]}
            productName={title}
          />
        ) : (
          <div className="rounded-[20px] border border-foreground/10 bg-muted/40 p-5 text-center text-foreground/60">
            {t.product.outOfStockMsg}
          </div>
        )}
      </div>

      {/* 4 — Convince: description, then A+ blocks, then proof */}
      {description ? (
        <p
          className="mt-8 whitespace-pre-line text-[15px] leading-relaxed text-foreground/70"
          dir={isAr ? "rtl" : "ltr"}
        >
          {description}
        </p>
      ) : null}

      <ProductDescription blocks={product.description_blocks ?? []} />

      <ProductReviews reviews={reviews} average={ratingAvg} />

      {/* 5 — Keep them shopping */}
      {related.length > 0 && (
        <section className="pt-12">
          <h2 className="m-0 mb-5 font-serif text-[clamp(22px,3vw,30px)] font-medium">{t.product.moreProducts}</h2>
          <div className="grid grid-cols-2 gap-4">
            {related.map((r) => (
              <ProductCard key={r.slug} product={r} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
