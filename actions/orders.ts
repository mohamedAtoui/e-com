"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCommune, getWilaya } from "@/lib/algeria-data";
import { sendCapiLead, sendCapiPurchase } from "@/lib/meta/capi";
import { sendOrderNotification } from "@/lib/notify/telegram";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validators";
import type { CreateOrderResult, OrderStatus } from "@/types/database.types";

const ERROR_MESSAGES: Record<string, string> = {
  insufficient_stock: "Stock insuffisant pour ce produit.",
  product_unavailable: "Ce produit n'est plus disponible.",
  invalid_commune_for_wilaya: "La commune ne correspond pas à la wilaya.",
  no_delivery_to_wilaya: "Livraison indisponible vers cette wilaya.",
  home_delivery_unavailable: "Livraison à domicile indisponible ici.",
  stopdesk_unavailable: "Livraison au bureau indisponible ici.",
};

export interface CreateOrderState {
  ok: boolean;
  error?: string;
  result?: CreateOrderResult;
}

/** Public order creation. Validates input, then calls the create_order RPC
 *  (service role) which recomputes totals + reserves stock atomically. */
export async function createOrder(
  productId: string,
  raw: unknown,
  leadId?: string,
): Promise<CreateOrderState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`order:${ip}`, 5, 60_000)) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }
  const v = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("create_order", {
    p_customer_name: v.customer_name,
    p_customer_phone: v.customer_phone,
    p_wilaya_code: v.wilaya_code,
    p_commune_id: v.commune_id,
    p_address: v.address || null,
    p_delivery_method: v.delivery_method,
    p_items: [{ product_id: productId, quantity: v.quantity }],
  });

  if (error) {
    console.error("[create_order]", error.code, error.message);
    const matched = Object.keys(ERROR_MESSAGES).find((k) => error.message.includes(k));
    return {
      ok: false,
      error: matched ? ERROR_MESSAGES[matched] : "Une erreur est survenue. Réessayez.",
    };
  }

  const result = data as unknown as CreateOrderResult;

  // Mark the abandoned-checkout lead as converted (best-effort; non-blocking).
  if (leadId) {
    await admin
      .from("checkout_leads")
      .update({ status: "converted", order_id: result.order_id })
      .eq("id", leadId)
      .then(({ error }) => {
        if (error) console.error("[lead convert]", error.message);
      });
  }

  // Server-side CAPI Lead (deduped client-side via meta_event_id).
  await sendCapiLead({
    eventId: result.meta_event_id,
    value: result.subtotal,
    phone: v.customer_phone,
    name: v.customer_name,
    items: [{ product_id: productId, quantity: v.quantity, unit_price: result.subtotal / v.quantity }],
  }).catch((e) => console.error("[CAPI Lead]", e));

  // Instant new-order push to the store owner (Telegram; no-op if unconfigured).
  const { data: prod } = await admin
    .from("products")
    .select("name_fr")
    .eq("id", productId)
    .single();
  const commune = getCommune(v.commune_id)?.name_fr ?? String(v.commune_id);
  const wilaya = getWilaya(v.wilaya_code)?.name_fr ?? String(v.wilaya_code);
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  await sendOrderNotification({
    order_number: result.order_number,
    customer_name: v.customer_name,
    customer_phone: v.customer_phone,
    locality: `${commune}, ${wilaya}`,
    delivery_method: v.delivery_method,
    items: [{ name: prod?.name_fr ?? "Produit", quantity: v.quantity }],
    total: result.total,
    adminUrl: base ? `${base}/admin/orders/${result.order_id}` : undefined,
  }).catch((e) => console.error("[notify]", e));

  return { ok: true, result };
}

/** Admin-only status transition. Calls the update_order_status RPC (runs as the
 *  authenticated admin so RLS + the is_admin() guard apply). */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order_status", {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) return { ok: false, error: error.message };

  // On delivery, fire the real Purchase event server-side.
  if (status === "delivered") {
    const { data: order } = await supabase
      .from("orders")
      .select(
        "meta_event_id, subtotal, customer_phone, customer_name, order_items(product_id, quantity, unit_price)",
      )
      .eq("id", orderId)
      .single<{
        meta_event_id: string | null;
        subtotal: number;
        customer_phone: string;
        customer_name: string;
        order_items: { product_id: string; quantity: number; unit_price: number }[];
      }>();
    if (order?.meta_event_id) {
      await sendCapiPurchase({
        eventId: order.meta_event_id,
        value: order.subtotal,
        phone: order.customer_phone,
        name: order.customer_name,
        items: order.order_items ?? [],
      }).catch((e) => console.error("[CAPI Purchase]", e));
    }
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}
