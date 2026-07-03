"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/validators";
import type { LeadStatus } from "@/types/database.types";

const leadSchema = z.object({
  lead_id: z.string().uuid(),
  product_id: z.string().uuid(),
  customer_name: z.string().trim().max(120).optional().default(""),
  customer_phone: z.string().trim().max(40).optional().default(""),
  wilaya_code: z.coerce.number().int().min(1).max(99).optional().nullable(),
  commune_id: z.coerce.number().int().positive().optional().nullable(),
  delivery_method: z.enum(["home", "stopdesk"]).optional().nullable(),
  quantity: z.coerce.number().int().min(1).max(99).optional().nullable(),
});

/**
 * Progressive save of a partial (unsubmitted) checkout — the "abandoned cart"
 * capture. Called debounced from the storefront form. Only persists once a
 * plausible phone number exists, so the admin panel stays a list of leads the
 * store can actually call back. Best-effort; never blocks the shopper.
 */
export async function saveCheckoutLead(raw: unknown): Promise<{ ok: boolean }> {
  const parsed = leadSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };
  const v = parsed.data;

  const phone = v.customer_phone ? normalizePhone(v.customer_phone) : "";
  // Need at least a mostly-complete phone to be worth capturing.
  if (phone.replace(/\D/g, "").length < 9) return { ok: false };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // Generous: a form fills across many keystrokes (debounced client-side).
  if (!rateLimit(`lead:${ip}`, 40, 60_000)) return { ok: false };

  const admin = createAdminClient();
  const { error } = await admin.from("checkout_leads").upsert(
    {
      id: v.lead_id,
      product_id: v.product_id,
      customer_name: v.customer_name || null,
      customer_phone: phone,
      wilaya_code: v.wilaya_code ?? null,
      commune_id: v.commune_id ?? null,
      delivery_method: v.delivery_method ?? null,
      quantity: v.quantity ?? null,
    },
    { onConflict: "id" },
  );

  if (error) {
    console.error("[saveCheckoutLead]", error.message);
    return { ok: false };
  }
  return { ok: true };
}

/** Admin: mark a lead converted (usually automatic) or dismissed. */
export async function updateLeadStatus(id: string, status: LeadStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("checkout_leads")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/leads");
  return { ok: true };
}
