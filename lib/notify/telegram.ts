import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatDZD } from "@/lib/money";

/**
 * Instant new-order push to the store owner via a Telegram bot — the most
 * reliable, zero-cost channel for an Algerian COD store.
 *
 * Config precedence: admin Settings (DB) → env (TELEGRAM_BOT_TOKEN /
 * TELEGRAM_CHAT_ID). Managing it in /admin/settings means the owner can fix a
 * wrong token/chat id and re-test WITHOUT a redeploy.
 *
 * Setup: create a bot with @BotFather, send it any message (a bot cannot DM a
 * user who hasn't messaged it first), then set the token + your chat id.
 */
export interface OrderNotification {
  order_number: number;
  customer_name: string;
  customer_phone: string;
  locality: string; // "Commune, Wilaya"
  delivery_method: string;
  items: { name: string; quantity: number }[];
  total: number;
  adminUrl?: string;
}

export interface TelegramResult {
  ok: boolean;
  error?: string;
}

function esc(s: string): string {
  // HTML parse_mode — escape the three reserved characters.
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Resolve Telegram config: DB settings win, env is the fallback. Trimmed. */
async function getConfig(): Promise<{ token: string | null; chatId: string | null }> {
  let token = process.env.TELEGRAM_BOT_TOKEN ?? null;
  let chatId = process.env.TELEGRAM_CHAT_ID ?? null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("settings")
      .select("telegram_bot_token, telegram_chat_id")
      .eq("id", true)
      .single();
    if (data?.telegram_bot_token) token = data.telegram_bot_token;
    if (data?.telegram_chat_id) chatId = data.telegram_chat_id;
  } catch {
    // settings unavailable (e.g. no service-role key) — env fallback stands
  }
  return { token: token?.trim() || null, chatId: chatId?.trim() || null };
}

/** Low-level send. Returns the REAL Telegram error so the admin test can show it. */
export async function sendTelegram(text: string): Promise<TelegramResult> {
  const { token, chatId } = await getConfig();
  if (!token || !chatId) {
    return { ok: false, error: "Telegram non configuré : token ou chat id manquant." };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json().catch(() => null)) as
      | { ok?: boolean; description?: string }
      | null;
    if (!res.ok || !json?.ok) {
      return { ok: false, error: json?.description || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Fire-and-forget new-order push (best-effort; logs the real error server-side). */
export async function sendOrderNotification(o: OrderNotification): Promise<void> {
  const lines = [
    `🛒 <b>Nouvelle commande #${o.order_number}</b>`,
    ``,
    `👤 ${esc(o.customer_name)}`,
    `📞 ${esc(o.customer_phone)}`,
    `📍 ${esc(o.locality)}`,
    `🚚 ${o.delivery_method === "stopdesk" ? "Stop Desk" : "À domicile"}`,
    ``,
    ...o.items.map((it) => `• ${esc(it.name)} ×${it.quantity}`),
    ``,
    `💰 <b>${esc(formatDZD(o.total))}</b>`,
  ];
  if (o.adminUrl) lines.push(``, o.adminUrl);

  const r = await sendTelegram(lines.join("\n"));
  if (!r.ok) console.error("[telegram]", r.error);
}
