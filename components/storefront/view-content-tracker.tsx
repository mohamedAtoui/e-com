"use client";

import { useEffect } from "react";

import { buildEventPayload } from "@/lib/meta/events";
import { pixel } from "@/lib/meta/pixel";

export function ViewContentTracker({
  productId,
  price,
}: {
  productId: string;
  price: number;
}) {
  useEffect(() => {
    pixel.viewContent(
      buildEventPayload([{ product_id: productId, quantity: 1, unit_price: price }]),
    );
  }, [productId, price]);
  return null;
}
