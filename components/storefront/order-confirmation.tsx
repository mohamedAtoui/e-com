"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { useLang } from "@/components/storefront/lang-provider";
import { META_CURRENCY } from "@/lib/meta/events";
import { pixel } from "@/lib/meta/pixel";
import { formatDZD } from "@/lib/money";
import type { OrderSummary } from "@/types/database.types";

export function OrderConfirmation({
  summary,
  locality,
  eventId,
}: {
  summary: NonNullable<OrderSummary>;
  locality: string;
  eventId: string;
}) {
  const { t, lang } = useLang();
  const p = t.product;
  const isAr = lang === "ar";

  // Fire the Lead Pixel event once on the thank-you page. Deduped against the
  // server-side CAPI Lead via the shared event_id (= the order's meta_event_id).
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    // product_id is only present once migration 0011 is applied; fall back to
    // an unattributed (but still valued) Lead before that.
    const withIds = summary.items.filter((i) => i.product_id);
    pixel.lead(
      {
        content_ids: withIds.map((i) => i.product_id!),
        contents: withIds.map((i) => ({
          id: i.product_id!,
          quantity: i.quantity,
          item_price: i.unit_price,
        })),
        value: summary.subtotal,
        currency: META_CURRENCY,
      },
      eventId,
    );
  }, [eventId, summary.subtotal, summary.items]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2B2724] text-2xl text-[#F4B860]">
        ✓
      </div>
      <h1 className="font-serif text-3xl font-medium">{p.thankTitle}</h1>
      <p className="mt-2 text-foreground/70">{p.thankBody}</p>

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
        {p.backHome}
      </Link>
    </div>
  );
}
