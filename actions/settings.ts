"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { sendTelegram } from "@/lib/notify/telegram";

const feeSchema = z.object({
  wilaya_code: z.coerce.number().int(),
  home_fee: z.coerce.number().int().min(0),
  stopdesk_fee: z.coerce.number().int().min(0),
  home_available: z.coerce.boolean(),
  stopdesk_available: z.coerce.boolean(),
});

export async function updateDeliveryFee(raw: unknown) {
  const parsed = feeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("delivery_fees")
    .update({
      home_fee: v.home_fee,
      stopdesk_fee: v.stopdesk_fee,
      home_available: v.home_available,
      stopdesk_available: v.stopdesk_available,
    })
    .eq("wilaya_code", v.wilaya_code);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

const settingsSchema = z.object({
  store_name: z.string().trim().min(1).max(120),
  meta_pixel_id: z.string().trim().max(40).optional().or(z.literal("")),
  telegram_bot_token: z.string().trim().max(120).optional().or(z.literal("")),
  telegram_chat_id: z.string().trim().max(40).optional().or(z.literal("")),
});

export async function updateSettings(raw: unknown) {
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const v = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      store_name: v.store_name,
      meta_pixel_id: v.meta_pixel_id || null,
      telegram_bot_token: v.telegram_bot_token || null,
      telegram_chat_id: v.telegram_chat_id || null,
    })
    .eq("id", true);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

/** Admin: send a test Telegram message and return the REAL result/error. */
export async function sendTestTelegram(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { ok: false, error: "Non autorisé." };
  return sendTelegram("✅ <b>Test Lighty</b> — les notifications Telegram fonctionnent !");
}
