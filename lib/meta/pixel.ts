"use client";

import type { MetaEventPayload } from "./events";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function track(event: string, params?: object, eventId?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) window.fbq("track", event, params ?? {}, { eventID: eventId });
  else window.fbq("track", event, params ?? {});
}

export const pixel = {
  viewContent(payload: MetaEventPayload) {
    track("ViewContent", payload);
  },
  initiateCheckout(payload: MetaEventPayload) {
    track("InitiateCheckout", payload);
  },
  /** Fired on successful order submit; eventId dedups against the server CAPI Lead. */
  lead(payload: MetaEventPayload, eventId: string) {
    track("Lead", payload, eventId);
  },
};
