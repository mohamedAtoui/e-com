"use client";

import { RotateCcw, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";

import { CheckoutForm, type FeeInfo } from "@/components/storefront/checkout-form";
import { useLang } from "@/components/storefront/lang-provider";
import { ProductDescription } from "@/components/storefront/product-description";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { formatDZD } from "@/lib/money";
import { normalizeOffers } from "@/lib/offers";
import type { ProductRow } from "@/types/database.types";

const SERIF = "var(--font-serif), var(--font-arabic-heading), serif";

function scrollToOrder() {
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
  const offers = normalizeOffers(product.offers);
  const discount = onSale
    ? Math.round((1 - product.price / product.compare_at_price!) * 100)
    : 0;

  const title = isAr ? product.name_ar || product.name_fr : product.name_fr || product.name_ar;
  const subtitle = isAr ? product.name_fr : product.name_ar;
  const description = isAr ? product.description_ar : product.description_fr;
  const lowStock = available > 0 && available <= 5;

  const trust = [
    { icon: ShieldCheck, label: t.product.trust.cod },
    { icon: Truck, label: t.product.trust.delivery },
    { icon: RotateCcw, label: t.product.trust.guarantee },
    { icon: Sparkles, label: t.product.trust.quality },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-[clamp(18px,5vw,60px)] pb-24 pt-8 lg:pb-12">
      <Link href="/collection" className="mb-6 inline-flex items-center gap-2 text-[13.5px] font-semibold text-foreground/55 transition-colors hover:text-foreground">
        <span className="text-[16px]">{dir === "rtl" ? "→" : "←"}</span>
        {t.colPage.back}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductGallery images={product.images ?? []} alt={title} />
        </div>

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

          {/* Price + savings */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-serif text-[34px] font-semibold leading-none">{formatDZD(product.price)}</span>
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

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {trust.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.label} className="flex items-center gap-2 rounded-xl border border-foreground/10 bg-white/50 px-3 py-2.5 text-[12.5px] font-medium leading-tight">
                  <Icon className="size-4 shrink-0 text-primary" />
                  <span>{b.label}</span>
                </div>
              );
            })}
          </div>

          {/* Bulk offers */}
          {offers.length > 0 && (
            <div className="rounded-[16px] border border-[#F4B860]/40 bg-[#F4B860]/10 p-4">
              <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-[#b4773f]">{t.product.promos}</p>
              <div className="flex flex-wrap gap-2">
                {offers.map((o) => (
                  <span key={o.qty} className="inline-flex items-baseline gap-1.5 rounded-full bg-white/70 px-3 py-1 text-sm">
                    <span className="font-semibold">{o.qty} {t.product.promoUnit}</span>
                    <span className="font-serif font-semibold">{formatDZD(o.price)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {description ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground/70" dir={isAr ? "rtl" : "ltr"}>
              {description}
            </p>
          ) : null}

          <div id="order" className="scroll-mt-24">
            {available > 0 ? (
              <CheckoutForm productId={product.id} price={product.price} offers={offers} deliveryFees={feeMap} />
            ) : (
              <div className="rounded-[20px] border border-foreground/10 bg-muted/40 p-5 text-center text-foreground/60">
                {t.product.outOfStockMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rich description blocks */}
      <ProductDescription blocks={product.description_blocks ?? []} />

      {/* Sticky mobile order bar */}
      {available > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-3 border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex flex-col leading-tight">
            <span className="font-serif text-xl font-semibold">{formatDZD(product.price)}</span>
            {onSale && (
              <span className="text-[12px] text-foreground/45 line-through">{formatDZD(product.compare_at_price!)}</span>
            )}
          </div>
          <button
            onClick={scrollToOrder}
            className="flex-1 rounded-full bg-[#2B2724] px-6 py-3.5 text-[15px] font-semibold text-[#FAF7F2] transition-shadow hover:shadow-[0_12px_32px_-10px_rgba(244,184,96,.95)]"
          >
            {t.product.orderCta}
          </button>
        </div>
      )}
    </div>
  );
}
