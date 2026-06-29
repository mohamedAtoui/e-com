"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder } from "@/actions/orders";
import { WILAYAS, getCommunes } from "@/lib/algeria-data";
import { buildEventPayload } from "@/lib/meta/events";
import { pixel } from "@/lib/meta/pixel";
import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";
import { checkoutSchema, type CheckoutInput } from "@/lib/validators";
import type { CreateOrderResult } from "@/types/database.types";

export interface FeeInfo {
  home_fee: number;
  stopdesk_fee: number;
  home_available: boolean;
  stopdesk_available: boolean;
}

interface CheckoutFormProps {
  productId: string;
  price: number;
  deliveryFees: Record<number, FeeInfo>;
}

const selectClass =
  "h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50";

export function CheckoutForm({ productId, price, deliveryFees }: CheckoutFormProps) {
  const [submitted, setSubmitted] = useState<CreateOrderResult | null>(null);
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
      address: "",
      delivery_method: "home",
      quantity: 1,
    },
  });

  const wilayaCode = Number(watch("wilaya_code")) || 0;
  const method = watch("delivery_method");
  const quantity = Number(watch("quantity")) || 1;

  const communes = useMemo(() => getCommunes(wilayaCode), [wilayaCode]);
  const fee = deliveryFees[wilayaCode];
  const deliveryFee =
    fee && method === "home"
      ? fee.home_fee
      : fee && method === "stopdesk"
        ? fee.stopdesk_fee
        : 0;
  const subtotal = price * quantity;
  const total = subtotal + deliveryFee;

  function trackCheckout() {
    if (checkoutTracked.current) return;
    checkoutTracked.current = true;
    pixel.initiateCheckout(
      buildEventPayload([{ product_id: productId, quantity, unit_price: price }]),
    );
  }

  async function onSubmit(values: CheckoutInput) {
    setServerError(null);
    const res = await createOrder(productId, values);
    if (!res.ok || !res.result) {
      setServerError(res.error ?? "Erreur");
      return;
    }
    pixel.lead(
      buildEventPayload([
        { product_id: productId, quantity: Number(values.quantity), unit_price: price },
      ]),
      res.result.meta_event_id,
    );
    setSubmitted(res.result);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <h3 className="text-lg font-semibold text-primary">Commande confirmée ✓</h3>
        <p className="mt-1 text-sm" dir="rtl" lang="ar">
          تم تسجيل طلبك بنجاح
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Commande <span className="font-mono font-medium">#{submitted.order_number}</span>.
          Nous vous appellerons pour confirmer la livraison.
        </p>
        <p className="mt-2 font-medium">Total à payer : {formatDZD(submitted.total)}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onFocus={trackCheckout}
      className="space-y-4 rounded-xl border bg-card p-5"
    >
      <div>
        <h3 className="text-lg font-semibold">Commander — الطلب</h3>
        <p className="text-sm text-muted-foreground">
          Paiement à la livraison · الدفع عند الاستلام
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customer_name">Nom complet — الاسم الكامل</Label>
        <Input id="customer_name" {...register("customer_name")} placeholder="Votre nom" />
        {errors.customer_name && (
          <p className="text-xs text-destructive">{errors.customer_name.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="customer_phone">Téléphone — رقم الهاتف</Label>
        <Input
          id="customer_phone"
          inputMode="tel"
          {...register("customer_phone")}
          placeholder="0X XX XX XX XX"
        />
        {errors.customer_phone && (
          <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="wilaya_code">Wilaya — الولاية</Label>
          <select
            id="wilaya_code"
            className={selectClass}
            {...register("wilaya_code", {
              onChange: () => setValue("commune_id", "" as unknown as number),
            })}
          >
            <option value="">Choisir…</option>
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {w.name_fr}
              </option>
            ))}
          </select>
          {errors.wilaya_code && (
            <p className="text-xs text-destructive">Wilaya requise</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="commune_id">Commune — البلدية</Label>
          <select
            id="commune_id"
            className={selectClass}
            disabled={!wilayaCode}
            {...register("commune_id")}
          >
            <option value="">Choisir…</option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_fr}
              </option>
            ))}
          </select>
          {errors.commune_id && (
            <p className="text-xs text-destructive">Commune requise</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Mode de livraison — طريقة التوصيل</Label>
        <div className="grid grid-cols-2 gap-3">
          <DeliveryOption
            label="À domicile"
            sub="إلى المنزل"
            fee={fee?.home_fee}
            selected={method === "home"}
            disabled={fee ? !fee.home_available : false}
            value="home"
            register={register("delivery_method")}
          />
          <DeliveryOption
            label="Au bureau (Stop Desk)"
            sub="إلى المكتب"
            fee={fee?.stopdesk_fee}
            selected={method === "stopdesk"}
            disabled={fee ? !fee.stopdesk_available : false}
            value="stopdesk"
            register={register("delivery_method")}
          />
        </div>
      </div>

      {method === "home" && (
        <div className="space-y-1.5">
          <Label htmlFor="address">Adresse — العنوان</Label>
          <Input id="address" {...register("address")} placeholder="Rue, quartier…" />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="quantity">Quantité — الكمية</Label>
        <Input
          id="quantity"
          type="number"
          min={1}
          max={99}
          className="w-24"
          {...register("quantity")}
        />
      </div>

      <dl className="space-y-1 border-t pt-3 text-sm">
        <Row label="Sous-total" value={formatDZD(subtotal)} />
        <Row
          label="Livraison"
          value={wilayaCode ? formatDZD(deliveryFee) : "—"}
        />
        <Row label="Total" value={formatDZD(total)} strong />
      </dl>

      {serverError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Envoi…" : "Confirmer la commande — تأكيد الطلب"}
      </Button>
    </form>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between", strong && "text-base font-semibold")}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
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
        "flex cursor-pointer flex-col rounded-md border p-3 text-sm transition",
        selected ? "border-primary ring-1 ring-primary" : "border-input",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <input type="radio" value={value} className="sr-only" disabled={disabled} {...register} />
      <span className="font-medium">{label}</span>
      <span className="font-arabic text-xs text-muted-foreground" dir="rtl">
        {sub}
      </span>
      {fee != null && (
        <span className="mt-1 text-xs text-muted-foreground">{formatDZD(fee)}</span>
      )}
    </label>
  );
}
