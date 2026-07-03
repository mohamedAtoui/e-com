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
import { saveCheckoutLead } from "@/actions/leads";
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
  const customerName = watch("customer_name");
  const customerPhone = watch("customer_phone");
  const communeId = watch("commune_id");

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

  // Abandoned-checkout capture: keep one lead row per visit (id in sessionStorage)
  // and upsert it, debounced, as the shopper fills the form. Persists server-side
  // only once a plausible phone exists — so the admin sees leads it can call back.
  const leadIdRef = useRef<string>("");
  useEffect(() => {
    try {
      const key = `lead-${productId}`;
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(key, id);
      }
      leadIdRef.current = id;
    } catch {
      leadIdRef.current = "";
    }
  }, [productId]);

  useEffect(() => {
    if (!leadIdRef.current) return;
    if ((customerPhone ?? "").replace(/\D/g, "").length < 9) return;
    const t = setTimeout(() => {
      saveCheckoutLead({
        lead_id: leadIdRef.current,
        product_id: productId,
        customer_name: customerName ?? "",
        customer_phone: customerPhone ?? "",
        wilaya_code: wilayaCode || null,
        commune_id: Number(communeId) || null,
        delivery_method: method ?? null,
        quantity,
      }).catch(() => {});
    }, 900);
    return () => clearTimeout(t);
  }, [customerName, customerPhone, wilayaCode, communeId, method, quantity, productId]);

  const fee = deliveryFees[wilayaCode];
  const deliveryFee =
    fee && method === "home" ? fee.home_fee : fee && method === "stopdesk" ? fee.stopdesk_fee : 0;
  const { subtotal, unitPrice, offer } = computeLine(price, offers, quantity);
  const total = subtotal + deliveryFee;
  // Regular (non-promo) subtotal, and how much the active promo saves.
  const regularSubtotal = price * quantity;
  const saved = Math.max(0, regularSubtotal - subtotal);
  // Best-value tier = lowest price-per-unit; used to badge the top deal.
  const bestQty = offers.length
    ? offers.reduce((b, o) => (o.price / o.qty < b.price / b.qty ? o : b)).qty
    : 0;

  const setQty = (n: number) =>
    setValue("quantity", Math.min(99, Math.max(1, n)), { shouldValidate: true });

  function trackCheckout() {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    pixel.initiateCheckout(buildEventPayload([{ product_id: productId, quantity, unit_price: unitPrice }]));
  }

  async function onSubmit(values: CheckoutInput) {
    setServerError(null);
    const res = await createOrder(productId, values, leadIdRef.current || undefined);
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
        <div className="space-y-2">
          <Label>{p.promos}</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <PackCard
              selected={!offer}
              onClick={() => setQty(1)}
              qtyLabel={`1 ${p.promoUnit}`}
              price={formatDZD(price)}
            />
            {offers.map((o) => {
              const each = Math.round(o.price / o.qty);
              const save = price * o.qty - o.price;
              return (
                <PackCard
                  key={o.qty}
                  selected={quantity === o.qty}
                  onClick={() => setQty(o.qty)}
                  qtyLabel={`${o.qty} ${p.promoUnit}`}
                  price={formatDZD(o.price)}
                  each={p.promoEach.replace("{n}", formatDZD(each))}
                  save={save > 0 ? p.promoSave.replace("{n}", formatDZD(save)) : undefined}
                  best={o.qty === bestQty ? p.promoBest : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="quantity">{p.quantity}</Label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="-"
            onClick={() => setQty(quantity - 1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-input text-lg transition hover:border-foreground/40 disabled:opacity-40"
            disabled={quantity <= 1}
          >
            −
          </button>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={99}
            className="h-11 w-16 rounded-xl text-center"
            {...register("quantity")}
          />
          <button
            type="button"
            aria-label="+"
            onClick={() => setQty(quantity + 1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-input text-lg transition hover:border-foreground/40 disabled:opacity-40"
            disabled={quantity >= 99}
          >
            +
          </button>
        </div>
      </div>

      <dl className="space-y-1 border-t border-foreground/10 pt-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-foreground/60">{p.subtotal}</dt>
          <dd className="flex items-center gap-2">
            {saved > 0 && <span className="text-foreground/40 line-through">{formatDZD(regularSubtotal)}</span>}
            <span>{formatDZD(subtotal)}</span>
          </dd>
        </div>
        {saved > 0 && (
          <div className="flex justify-between text-[#7BA05B]">
            <dt className="font-medium">{p.promos}</dt>
            <dd className="font-semibold">− {formatDZD(saved)}</dd>
          </div>
        )}
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

function PackCard({
  selected,
  onClick,
  qtyLabel,
  price,
  each,
  save,
  best,
}: {
  selected: boolean;
  onClick: () => void;
  qtyLabel: string;
  price: string;
  each?: string;
  save?: string;
  best?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col rounded-xl border p-3 text-start transition",
        selected
          ? "border-[#2B2724] bg-[#F4B860]/10 ring-1 ring-[#F4B860]"
          : "border-input hover:border-foreground/30",
      )}
    >
      {best && (
        <span className="absolute -top-2 right-2 rounded-full bg-[#2B2724] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#F4B860]">
          {best}
        </span>
      )}
      <span className="text-sm font-semibold">{qtyLabel}</span>
      <span className="font-serif text-base font-semibold">{price}</span>
      {each && <span className="text-[11px] text-foreground/55">{each}</span>}
      {save && <span className="mt-0.5 text-[11px] font-semibold text-[#7BA05B]">{save}</span>}
    </button>
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
