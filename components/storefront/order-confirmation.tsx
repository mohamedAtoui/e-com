"use client";

import Link from "next/link";

import { useLang } from "@/components/storefront/lang-provider";
import { formatDZD } from "@/lib/money";
import type { OrderSummary } from "@/types/database.types";

export function OrderConfirmation({
  summary,
  locality,
}: {
  summary: NonNullable<OrderSummary>;
  locality: string;
}) {
  const { t, lang } = useLang();
  const p = t.product;
  const isAr = lang === "ar";

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B2724] text-2xl text-[#F4B860]">
        ✓
      </div>
      <h1 className="font-serif text-3xl font-medium">{p.successTitle}</h1>
      <p className="mt-2 text-foreground/70">{p.successBody}</p>

      <div className="mx-auto mt-8 max-w-md rounded-[20px] border border-foreground/10 bg-white/60 p-5 text-start">
        <div className="flex justify-between text-sm">
          <span className="text-foreground/60">{p.orderRef}</span>
          <span className="font-mono font-medium">#{summary.order_number}</span>
        </div>
        <div className="mt-4 space-y-2 border-t border-foreground/10 pt-4">
          {summary.items.map((it, i) => {
            const name = isAr ? it.name_ar || it.name_fr : it.name_fr || it.name_ar;
            return (
              <div key={i} className="flex justify-between text-sm">
                <span>
                  {name} <span className="text-foreground/50">×{it.quantity}</span>
                </span>
                <span>{formatDZD(it.unit_price * it.quantity)}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 space-y-1 border-t border-foreground/10 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/60">{p.delivery}</span>
            <span>{formatDZD(summary.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>{p.total}</span>
            <span>{formatDZD(summary.total)}</span>
          </div>
        </div>
        <p className="mt-4 border-t border-foreground/10 pt-4 text-sm text-foreground/60">{locality}</p>
      </div>

      <Link
        href="/collection"
        className="mt-8 inline-flex items-center rounded-full bg-[#2B2724] px-7 py-3 text-[15px] font-semibold text-[#FAF7F2]"
      >
        {t.col.cta}
      </Link>
    </div>
  );
}
