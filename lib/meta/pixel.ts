"use client";

import type { MetaEventPayload } from "./events";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type QueuedEvent = { event: string; params?: object; eventId?: string };

// Events can be fired from a component effect (ViewContent, InitiateCheckout,
// Lead) BEFORE the Pixel base snippet has executed. Rather than drop them, we
// buffer and flush once `fbq` exists — so no conversion is ever lost to a race.
const queue: QueuedEvent[] = [];
let flushing = false;
let attempts = 0;
const MAX_ATTEMPTS = 40; // ~12s of retries, then give up (no pixel configured)

function fbqReady(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

function flush() {
  if (!fbqReady()) {
    if (flushing || attempts >= MAX_ATTEMPTS || queue.length === 0) return;
    flushing = true;
    attempts += 1;
    window.setTimeout(() => {
      flushing = false;
      flush();
    }, 300);
    return;
  }
  attempts = 0;
  while (queue.length) {
    const { event, params, eventId } = queue.shift()!;
    if (eventId) window.fbq!("track", event, params ?? {}, { eventID: eventId });
    else window.fbq!("track", event, params ?? {});
  }
}

function track(event: string, params?: object, eventId?: string) {
  if (typeof window === "undefined") return;
  queue.push({ event, params, eventId });
  flush();
}

export const pixel = {
  /** Re-fire PageView on client-side navigations (the base snippet only fires once). */
  pageView() {
    track("PageView");
  },
  viewContent(payload: MetaEventPayload) {
    track("ViewContent", payload);
  },
  /** Picking a bundle/quantity — the closest signal to "add to cart" in a COD funnel. */
  addToCart(payload: MetaEventPayload) {
    track("AddToCart", payload);
  },
  initiateCheckout(payload: MetaEventPayload) {
    track("InitiateCheckout", payload);
  },
  /** Fired on successful order submit; eventId dedups against the server CAPI Lead. */
  lead(payload: MetaEventPayload, eventId: string) {
    track("Lead", payload, eventId);
  },
};
