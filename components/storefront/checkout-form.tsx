"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useLang } from "@/components/storefront/lang-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder } from "@/actions/orders";
import { communesForWilaya } from "@/actions/geo";
import { WILAYAS } from "@/lib/wilayas";
import type { Commune } from "@/lib/algeria-data";
import { buildEventPayload } from "@/lib/meta/events";
import { pixel } from "@/lib/meta/pixel";
import { formatDZD } from "@/lib/money";
import { computeLine, type Offer } from "@/lib/offers";
import { cn } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators";

export interface FeeInfo {
  home_fee: number;
  stopdesk_fee: number;
  home_available: boolean;
  stopdesk_available: boolean;
}

interface CheckoutFormProps {
  productId: string;
  price: number;
  offers?: Offer[];
  deliveryFees: Record<number, FeeInfo>;
}

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50";

export function CheckoutForm({ productId, price, offers = [], deliveryFees }: CheckoutFormProps) {
  const { t, lang } = useLang();
  const p = t.product;
  const isAr = lang === "ar";
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const checkoutTracked = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      wilaya_code: "" as unknown as number,
      commune_id: "" as unknown as number,
      delivery_method: "home",
      quantity: 1,
    },
  });

  const wilayaCode = Number(watch("wilaya_code")) || 0;
  const method = watch("delivery_method");
  const quantity = Number(watch("quantity")) || 1;

  const [communes, setCommunes] = useState<Commune[]>([]);
  useEffect(() => {
    if (!wilayaCode) {
      setCommunes([]);
      return;
    }
    let active = true;
    communesForWilaya(wilayaCode).then((c) => {
      if (active) setCommunes(c);
    });
    return () => {
      active = false;
    };
  }, [wilayaCode]);

  const fee = deliveryFees[wilayaCode];
  const deliveryFee =
    fee && method === "home" ? fee.home_fee : fee && method === "stopdesk" ? fee.stopdesk_fee : 0;
  const { subtotal, unitPrice, offer } = computeLine(price, offers, quantity);
  const total = subtotal + deliveryFee;

  function trackCheckout() {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    pixel.initiateCheckout(buildEventPayload([{ product_id: productId, quantity, unit_price: unitPrice }]));
  }

  async function onSubmit(values: CheckoutInput) {
    setServerError(null);
    const res = await createOrder(productId, values);
    if (!res.ok || !res.result) {
      setServerError(res.error ?? "Erreur");
      return;
    }
    // The Lead Pixel event fires on the thank-you page (reliable post-navigation
    // and deduped server-side via meta_event_id). Redirect there now.
    router.push(`/commande/${res.result.meta_event_id}`);
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocus={trackCheckout}
      className="space-y-4 rounded-[20px] border border-foreground/10 bg-white/60 p-5"
    >
      <h3 className="font-serif text-xl font-medium">{p.order}</h3>

      <div className="space-y-1.5">
        <Label htmlFor="customer_name">{p.name}</Label>
        <Input id="customer_name" {...register("customer_name")} className="h-11 rounded-xl" />
        {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customer_phone">{p.phone}</Label>
        <Input id="customer_phone" inputMode="tel" {...register("customer_phone")} placeholder="0X XX XX XX XX" className="h-11 rounded-xl" />
        {errors.customer_phone && <p className="text-xs text-destructive">{errors.customer_phone.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="wilaya_code">{p.wilaya}</Label>
          <select id="wilaya_code" className={selectClass} {...register("wilaya_code", { onChange: () => setValue("commune_id", "" as unknown as number) })}>
            <option value="">{p.choose}</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {isAr ? w.name_ar : w.name_fr}
              </option>
            ))}
          </select>
          {errors.wilaya_code && <p className="text-xs text-destructive">{p.wilaya}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="commune_id">{p.commune}</Label>
          <select id="commune_id" className={selectClass} disabled={!wilayaCode} {...register("commune_id")}>
            <option value="">{p.choose}</option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {isAr ? c.name_ar : c.name_fr}
              </option>
            ))}
          </select>
          {errors.commune_id && <p className="text-xs text-destructive">{p.commune}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{p.deliveryMode}</Label>
        <div className="grid grid-cols-2 gap-3">
          <DeliveryOption label={p.home} sub={p.homeSub} fee={fee?.home_fee} selected={method === "home"} disabled={fee ? !fee.home_available : false} value="home" register={register("delivery_method")} />
          <DeliveryOption label={p.stopdesk} sub={p.stopdeskSub} fee={fee?.stopdesk_fee} selected={method === "stopdesk"} disabled={fee ? !fee.stopdesk_available : false} value="stopdesk" register={register("delivery_method")} />
        </div>
      </div>

      {offers.length > 0 && (
        <div className="space-y-1.5">
          <Label>{p.promos}</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {offers.map((o) => {
              const selected = quantity === o.qty;
              const each = Math.round(o.price / o.qty);
              const save = price * o.qty - o.price;
              return (
                <button
                  key={o.qty}
                  type="button"
                  onClick={() => setValue("quantity", o.qty, { shouldValidate: true })}
                  className={cn(
                    "flex flex-col rounded-xl border p-3 text-start transition",
                    selected ? "border-[#2B2724] bg-[#F4B860]/10 ring-1 ring-[#F4B860]" : "border-input hover:border-foreground/30",
                  )}
                >
                  <span className="text-sm font-semibold">
                    {o.qty} {p.promoUnit}
                  </span>
                  <span className="font-serif text-base font-semibold">{formatDZD(o.price)}</span>
                  <span className="text-[11px] text-foreground/55">{p.promoEach.replace("{n}", formatDZD(each))}</span>
                  {save > 0 && (
                    <span className="mt-0.5 text-[11px] font-semibold text-[#7BA05B]">
                      {p.promoSave.replace("{n}", formatDZD(save))}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="quantity">{p.quantity}</Label>
        <Input id="quantity" type="number" min={1} max={99} className="h-11 w-24 rounded-xl" {...register("quantity")} />
      </div>

      <dl className="space-y-1 border-t border-foreground/10 pt-3 text-sm">
        <Row label={offer ? `${p.subtotal} · ${p.promos}` : p.subtotal} value={formatDZD(subtotal)} />
        <Row label={p.delivery} value={wilayaCode ? formatDZD(deliveryFee) : "—"} />
        <Row label={p.total} value={formatDZD(total)} strong />
      </dl>

      {serverError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full rounded-full bg-[#2B2724] py-6 text-[15.5px] font-semibold text-[#FAF7F2] transition-shadow hover:shadow-[0_16px_40px_-12px_rgba(244,184,96,.95)]">
        {isSubmitting ? p.submitting : p.submit}
      </Button>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "text-base font-semibold")}>
      <dt className={strong ? "" : "text-foreground/60"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function DeliveryOption({
  label,
  sub,
  fee,
  selected,
  disabled,
  value,
  register,
}: {
  label: string;
  sub: string;
  fee?: number;
  selected: boolean;
  disabled: boolean;
  value: string;
  register: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer flex-col rounded-xl border p-3 text-sm transition",
        selected ? "border-[#2B2724] ring-1 ring-[#F4B860]" : "border-input",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <input type="radio" value={value} className="sr-only" disabled={disabled} {...register} />
      <span className="font-medium">{label}</span>
      <span className="text-xs text-foreground/55">{sub}</span>
      {fee != null && <span className="mt-1 text-xs text-foreground/55">{formatDZD(fee)}</span>}
    </label>
  );
}
