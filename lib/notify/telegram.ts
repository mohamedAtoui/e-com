import "server-only";

import { formatDZD } from "@/lib/money";

/**
 * Instant new-order push to the store owner via a Telegram bot — the most
 * reliable, zero-cost channel for an Algerian COD store (the owner already
 * lives in Telegram, and it reaches their phone even with the dashboard closed).
 *
 * Setup: create a bot with @BotFather, then set:
 *   TELEGRAM_BOT_TOKEN   = 123456:ABC-...
 *   TELEGRAM_CHAT_ID     = your chat/group id (message the bot, or add it to a
 *                          group, then read getUpdates to find the id)
 * Unconfigured → no-op (like the Meta CAPI integration).
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

function esc(s: string): string {
  // HTML parse_mode — escape the three reserved characters.
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendOrderNotification(o: OrderNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return; // not configured — no-op

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

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n"),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error("[telegram]", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[telegram]", e);
  }
}
