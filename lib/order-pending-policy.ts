import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// The legacy database scheduler only cancels the literal "pending" key.
// Both keys reserve stock; this one requires a manual decision by the team.
export const MANUAL_PENDING_STATUS = "awaiting_confirmation";

export function isRequiredOrderStatus(key: string) {
  return key === "pending" || key === MANUAL_PENDING_STATUS;
}

/** Trusted server callers only: use a service client, never expose it to UI. */
export async function ensureManualPendingStatus(admin: SupabaseClient<Database>) {
  const { error } = await admin.from("order_statuses").upsert({
    key: MANUAL_PENDING_STATUS,
    label_fr: "En attente",
    label_ar: "قيد الانتظار",
    stock_effect: "reserved",
    color: "#b98900",
    sort_order: 10,
    is_system: true,
  }, { onConflict: "key", ignoreDuplicates: true });
  if (error) throw new Error(`Cannot prepare waiting status: ${error.message}`);

  const { data, error: readError } = await admin.from("order_statuses")
    .select("stock_effect").eq("key", MANUAL_PENDING_STATUS).single();
  if (readError || data?.stock_effect !== "reserved") {
    throw new Error("The waiting status must reserve stock.");
  }
}

/** Immediately protect a newly committed order without changing inventory.
 * Conditional writes cannot overwrite a concurrent manual status change.
 * Retry transient API errors; never retry create_order after it committed.
 */
export async function protectPendingOrder(admin: SupabaseClient<Database>, orderId: string) {
  let message = "unknown error";
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await admin.from("orders")
      .update({ status: MANUAL_PENDING_STATUS })
      .eq("id", orderId).eq("status", "pending");
    if (!error) return;
    message = error.message;
  }
  throw new Error(`Could not protect order ${orderId}: ${message}`);
}
