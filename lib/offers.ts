/**
 * Quantity bundle offers ("les promos"): buy N for a fixed total price.
 * Example: [{ qty: 2, price: 3500 }, { qty: 3, price: 5000 }] means
 * "2 pièces = 3500 DA, 3 pièces = 5000 DA".
 *
 * Money is integer DZD everywhere (see lib/money.ts). `price` is the TOTAL
 * for the bundle, not a per-unit price. Pricing is recomputed server-side in
 * the create_order RPC (supabase/migrations/0004) — this module is the single
 * source of truth the client preview must mirror.
 */

export interface Offer {
  /** Bundle size (number of units). */
  qty: number;
  /** Total price in DZD for the whole bundle. */
  price: number;
}

/** Validate, sort, and dedupe raw offer data coming from the DB or a form. */
export function normalizeOffers(raw: unknown): Offer[] {
  if (!Array.isArray(raw)) return [];
  const byQty = new Map<number, number>();
  for (const o of raw) {
    if (!o || typeof o !== "object") continue;
    const qty = Math.trunc(Number((o as Offer).qty));
    const price = Math.trunc(Number((o as Offer).price));
    if (!Number.isFinite(qty) || qty < 2 || qty > 99) continue;
    if (!Number.isFinite(price) || price < 0) continue;
    byQty.set(qty, price); // last write wins on duplicate qty
  }
  return [...byQty.entries()]
    .map(([qty, price]) => ({ qty, price }))
    .sort((a, b) => a.qty - b.qty);
}

/** The offer that applies to an exact quantity, if any. */
export function findOffer(offers: Offer[], qty: number): Offer | undefined {
  return offers.find((o) => o.qty === qty);
}

export interface LinePricing {
  /** Line subtotal in DZD (offer total when a bundle matches, else base × qty). */
  subtotal: number;
  /** Effective per-unit price snapshot. */
  unitPrice: number;
  /** The bundle that was applied, if any. */
  offer?: Offer;
}

/**
 * Effective pricing for `qty` units, applying an exact bundle match when one
 * exists. Kept consistent (subtotal === unitPrice × qty) so every total
 * reconstructs the same on the order, the confirmation page, and the RPC.
 */
export function computeLine(basePrice: number, offers: Offer[], qty: number): LinePricing {
  const offer = findOffer(offers, qty);
  if (offer) {
    const unitPrice = Math.round(offer.price / qty);
    return { subtotal: unitPrice * qty, unitPrice, offer };
  }
  return { subtotal: basePrice * qty, unitPrice: basePrice };
}
