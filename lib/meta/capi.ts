import "server-only";

import { createHash } from "node:crypto";

import { buildEventPayload } from "./events";

const API_VERSION = "v19.0";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

/** Phone for Meta: E.164 digits, no '+'. DZ 0xxxxxxxxx -> 213xxxxxxxxx. */
function hashPhone(phone: string): string {
  let v = phone.replace(/\D/g, "");
  if (v.startsWith("0")) v = "213" + v.slice(1);
  return createHash("sha256").update(v).digest("hex");
}

interface CapiArgs {
  eventId: string;
  value: number;
  phone: string;
  name: string;
  items: { product_id: string; quantity: number; unit_price: number }[];
}

async function sendEvent(eventName: "Lead" | "Purchase", args: CapiArgs) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return; // CAPI not configured — no-op

  const payload = buildEventPayload(args.items);
  const [firstName, ...rest] = args.name.trim().split(/\s+/);

  const body = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: args.eventId,
        action_source: "website",
        event_source_url: process.env.NEXT_PUBLIC_SITE_URL,
        user_data: {
          ph: [hashPhone(args.phone)],
          fn: firstName ? [sha256(firstName)] : undefined,
          ln: rest.length ? [sha256(rest.join(" "))] : undefined,
        },
        custom_data: { ...payload, value: args.value },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  await fetch(
    `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
}

export function sendCapiLead(args: CapiArgs) {
  return sendEvent("Lead", args);
}

export function sendCapiPurchase(args: CapiArgs) {
  return sendEvent("Purchase", args);
}
