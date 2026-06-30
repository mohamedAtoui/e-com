"use client";

import Image from "next/image";
import Link from "next/link";

import { useLang } from "@/components/storefront/lang-provider";
import { productImageUrl } from "@/lib/images";
import { formatDZD } from "@/lib/money";
import type { ProductRow } from "@/types/database.types";

type CardProduct = Pick<
  ProductRow,
  | "slug"
  | "name_fr"
  | "name_ar"
  | "price"
  | "compare_at_price"
  | "images"
  | "stock_quantity"
  | "reserved_quantity"
>;

export function ProductCard({ product }: { product: CardProduct }) {
  const { lang, t } = useLang();
  const cover = product.images?.[0];
  const available = product.stock_quantity - product.reserved_quantity;
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price;

  const isAr = lang === "ar";
  const title = isAr ? product.name_ar || product.name_fr : product.name_fr || product.name_ar;
  const subtitle = isAr ? product.name_fr : product.name_ar;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-[20px] bg-white/50 p-3.5 pb-5 transition-[transform,box-shadow,background] duration-500 ease-[cubic-bezier(.22,.61,.36,1)] hover:-translate-y-3 hover:bg-white hover:shadow-[0_34px_62px_-28px_rgba(244,184,96,.9),0_18px_40px_-26px_rgba(43,39,36,.35)]"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden rounded-[14px]"
        style={{ background: "radial-gradient(120% 130% at 50% 130%,#ECE0CE,#F4ECDD)" }}
      >
        {cover ? (
          <Image
            src={productImageUrl(cover)}
            alt={title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : null}
        {/* warm bloom — off by default, switches on at hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[42%] z-[1] h-[64%] w-[84%] -translate-x-1/2 opacity-20 transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: "radial-gradient(46% 44% at 50% 16%,rgba(244,184,96,.95),rgba(244,184,96,.26) 50%,transparent 76%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[8%] left-1/2 z-[1] h-[13%] w-[60%] -translate-x-1/2 opacity-20 blur-[3px] transition-opacity duration-700 group-hover:opacity-100"
          style={{ background: "radial-gradient(50% 100% at 50% 0,rgba(244,184,96,.5),transparent 72%)" }}
        />
        {onSale ? (
          <span className="absolute left-3 top-3 z-[2] rounded-full bg-[#2B2724] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#FAF7F2]">
            {isAr ? "تخفيض" : "Promo"}
          </span>
        ) : null}
        {available <= 0 ? (
          <span className="absolute right-3 top-3 z-[2] rounded-full bg-background/90 px-3 py-1 text-[11px] font-semibold">
            {t.product.outOfStock}
          </span>
        ) : null}
      </div>

      <div className="mt-[18px] flex items-start justify-between gap-3">
        <div>
          <h3 className="m-0 font-serif text-[21px] font-medium leading-tight tracking-[-0.01em]">{title}</h3>
          {subtitle ? (
            <div className="mt-[5px] text-[13px] text-foreground/55" dir={isAr ? "ltr" : "rtl"}>
              {subtitle}
            </div>
          ) : null}
        </div>
        <div className="whitespace-nowrap font-serif text-[18px] font-semibold">{formatDZD(product.price)}</div>
      </div>

      {available > 0 ? (
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-foreground/50">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7BA05B]" />
          {t.colPage.inStock}
        </div>
      ) : null}

      <span className="mt-3.5 w-full rounded-full border-[1.5px] border-foreground/16 py-2.5 text-center text-[14px] font-semibold transition-all duration-300 group-hover:border-[#2B2724] group-hover:bg-[#2B2724] group-hover:text-[#FAF7F2]">
        {t.col.addToCart}
      </span>
    </Link>
  );
}
