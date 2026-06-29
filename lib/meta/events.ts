/** Shared Meta event helpers used by both the client Pixel and server CAPI. */

export const META_CURRENCY = "DZD";

export interface MetaContent {
  id: string;
  quantity: number;
  item_price: number;
}

export interface MetaEventPayload {
  content_ids: string[];
  contents: MetaContent[];
  value: number;
  currency: string;
}

export function buildEventPayload(
  items: { product_id: string; quantity: number; unit_price: number }[],
): MetaEventPayload {
  return {
    content_ids: items.map((i) => i.product_id),
    contents: items.map((i) => ({
      id: i.product_id,
      quantity: i.quantity,
      item_price: i.unit_price,
    })),
    value: items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    currency: META_CURRENCY,
  };
}
