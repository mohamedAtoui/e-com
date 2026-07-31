"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Phone, User } from "lucide-react";
import Image from "next/image";
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
import { productImageUrl } from "@/lib/images";
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
  /** Cover image path + name, used by the order summary and the sticky bar. */
  image?: string;
  productName?: string;
}

const selectClass =
  "h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50";

export function CheckoutForm({
  productId,
  price,
  offers = [],
  deliveryFees,
  image,
  productName,
}: CheckoutFormProps) {
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
  const baseDeliveryFee =
    fee && method === "home" ? fee.home_fee : fee && method === "stopdesk" ? fee.stopdesk_fee : 0;
  const { subtotal, unitPrice, offer } = computeLine(price, offers, quantity);
  // A bundle can waive delivery; create_order re-applies this server-side.
  const freeDelivery = offer?.free_delivery === true;
  const deliveryFee = freeDelivery ? 0 : baseDeliveryFee;
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

  /** Selecting a pack is the closest thing to "add to cart" in a COD funnel. */
  function pickQty(n: number, unit: number) {
    setQty(n);
    pixel.addToCart(buildEventPayload([{ product_id: productId, quantity: n, unit_price: unit }]));
  }

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
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onFocus={trackCheckout}
        className="space-y-5 rounded-[20px] border border-foreground/10 bg-white/60 p-5"
      >
        <h3 className="font-serif text-xl font-medium">{p.order}</h3>

        {/* 1 — Choose the pack first: the offer is the reason to buy more. */}
        {offers.length > 0 && (
          <div className="space-y-2">
            <Label>{p.promos}</Label>
            <div className="space-y-2.5">
              <OfferRow
                selected={!offer}
                onClick={() => pickQty(1, price)}
                title={`1 ${t.colPage.countOne}`}
                total={formatDZD(price)}
              />
              {offers.map((o) => {
                const regular = price * o.qty;
                const save = regular - o.price;
                const pct = regular > 0 ? Math.round((1 - o.price / regular) * 100) : 0;
                return (
                  <OfferRow
                    key={o.qty}
                    selected={quantity === o.qty}
                    onClick={() => pickQty(o.qty, Math.round(o.price / o.qty))}
                    title={
                      pct > 0
                        ? p.buyNGet.replace("{n}", String(o.qty)).replace("{p}", String(pct))
                        : `${o.qty} ${p.promoUnit}`
                    }
                    total={formatDZD(o.price)}
                    regular={save > 0 ? formatDZD(regular) : undefined}
                    save={save > 0 ? formatDZD(save) : undefined}
                    best={o.qty === bestQty ? p.promoBest : undefined}
                    perk={o.free_delivery ? p.freeDelivery : undefined}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* 2 — Quantity: primary when there are no packs, secondary otherwise. */}
        <div className="space-y-1.5">
          <Label htmlFor="quantity" className={offers.length > 0 ? "text-xs text-foreground/60" : undefined}>
            {offers.length > 0 ? p.otherQty : p.quantity}
          </Label>
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

        {/* 3 — Who and where. */}
        <div className="space-y-1.5">
          <Label htmlFor="customer_name">{p.name}</Label>
          <div className="relative">
            <User className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-foreground/35 [inset-inline-start:0.75rem]" />
            <Input id="customer_name" {...register("customer_name")} className="h-11 rounded-xl ps-10" />
          </div>
          {errors.customer_name && <p className="text-xs text-destructive">{errors.customer_name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="customer_phone">{p.phone}</Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-foreground/35 [inset-inline-start:0.75rem]" />
            <Input
              id="customer_phone"
              inputMode="tel"
              {...register("customer_phone")}
              placeholder="0X XX XX XX XX"
              className="h-11 rounded-xl ps-10"
            />
          </div>
          {errors.customer_phone && <p className="text-xs text-destructive">{errors.customer_phone.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="wilaya_code">{p.wilaya}</Label>
            <select
              id="wilaya_code"
              className={selectClass}
              {...register("wilaya_code", { onChange: () => setValue("commune_id", "" as unknown as number) })}
            >
              <option value="">{p.choose}</option>
              {WILAYAS.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.code} - {isAr ? w.name_ar : w.name_fr}
                </option>
              ))}
            </select>
            {errors.wilaya_code && <p className="text-xs text-destructive">{p.required}</p>}
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
            {errors.commune_id && <p className="text-xs text-destructive">{p.required}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>{p.deliveryMode}</Label>
          <div className="grid grid-cols-2 gap-3">
            <DeliveryOption label={p.home} sub={p.homeSub} fee={fee?.home_fee} selected={method === "home"} disabled={fee ? !fee.home_available : false} value="home" register={register("delivery_method")} />
            <DeliveryOption label={p.stopdesk} sub={p.stopdeskSub} fee={fee?.stopdesk_fee} selected={method === "stopdesk"} disabled={fee ? !fee.stopdesk_available : false} value="stopdesk" register={register("delivery_method")} />
          </div>
        </div>

        {/* 4 — Recap right before the CTA. */}
        <div className="rounded-2xl bg-[#F4EEE3]/60 p-4">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-foreground/55">{p.summary}</p>
          {(image || productName) && (
            <div className="mb-3 flex items-center gap-3">
              {image && (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-white">
                  <Image src={productImageUrl(image)} alt={productName ?? ""} fill sizes="48px" className="object-contain p-1" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{productName}</p>
                <p className="text-xs text-foreground/55">
                  {quantity} × {formatDZD(unitPrice)}
                </p>
              </div>
            </div>
          )}
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">{p.subtotal}</dt>
              <dd className="flex items-center gap-2">
                {saved > 0 && <span className="text-foreground/40 line-through">{formatDZD(regularSubtotal)}</span>}
                <span>{formatDZD(subtotal)}</span>
              </dd>
            </div>
            {saved > 0 && (
              <div className="flex justify-between text-[#3F8F2B]">
                <dt className="font-medium">{p.promos}</dt>
                <dd className="font-semibold">− {formatDZD(saved)}</dd>
              </div>
            )}
            {freeDelivery ? (
              <div className="flex justify-between">
                <dt className="text-foreground/60">{p.delivery}</dt>
                <dd className="flex items-center gap-2 font-semibold text-[#3F8F2B]">
                  {wilayaCode && baseDeliveryFee > 0 && (
                    <span className="font-normal text-foreground/40 line-through">{formatDZD(baseDeliveryFee)}</span>
                  )}
                  {p.freeDelivery}
                </dd>
              </div>
            ) : (
              <Row label={p.delivery} value={wilayaCode ? formatDZD(deliveryFee) : "—"} />
            )}
            <div className="flex justify-between border-t border-foreground/10 pt-2 text-base font-semibold">
              <dt>{p.total}</dt>
              <dd>{formatDZD(total)}</dd>
            </div>
          </dl>
        </div>

        {serverError && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{serverError}</p>}

        <div className="space-y-2">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="w-full rounded-full bg-[#3F8F2B] py-6 text-[16px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(63,143,43,.8)] transition hover:brightness-110"
          >
            {isSubmitting ? p.submitting : `${p.submit} · ${formatDZD(total)}`}
          </Button>
          <p className="text-center text-xs text-foreground/55">{p.codReassure}</p>
        </div>
      </form>

      {/* Sticky mobile bar — one big, unmistakable call to action. */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" })}
          className="w-full rounded-full bg-[#3F8F2B] px-6 py-4 text-center text-[17px] font-bold text-white shadow-[0_10px_28px_-10px_rgba(63,143,43,.8)] transition hover:brightness-110"
        >
          {p.orderCta}
        </button>
      </div>
    </>
  );
}

/** One full-width bundle tier: benefit headline + price, savings badge. */
function OfferRow({
  selected,
  onClick,
  title,
  total,
  regular,
  save,
  best,
  perk,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  total: string;
  regular?: string;
  save?: string;
  best?: string;
  perk?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex w-full items-center gap-3 rounded-xl border p-3 text-start transition",
        selected ? "border-[#3F8F2B] bg-[#3F8F2B]/8 ring-1 ring-[#3F8F2B]" : "border-input hover:border-foreground/30",
      )}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-[#3F8F2B]" : "border-foreground/30",
        )}
      >
        {selected && <span className="size-2.5 rounded-full bg-[#3F8F2B]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-semibold leading-tight">{title}</span>
        {perk && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#3F8F2B]/12 px-2 py-0.5 text-[10.5px] font-semibold text-[#3F8F2B]">
            🚚 {perk}
          </span>
        )}
      </span>
      <span className="shrink-0 text-end">
        <span className="block font-serif text-[17px] font-semibold">{total}</span>
        {regular && <span className="block text-[12px] text-foreground/40 line-through">{regular}</span>}
      </span>
      {save && (
        <span className="absolute -top-2 rounded-full bg-[#3F8F2B] px-2 py-0.5 text-[10px] font-bold text-white [inset-inline-end:0.75rem]">
          − {save}
        </span>
      )}
      {best && (
        <span className="absolute -top-2 rounded-full bg-[#2B2724] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#F4B860] [inset-inline-start:0.75rem]">
          {best}
        </span>
      )}
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
        selected ? "border-[#3F8F2B] ring-1 ring-[#3F8F2B]" : "border-input",
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
