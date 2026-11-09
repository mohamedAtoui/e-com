import test from "node:test";
import assert from "node:assert/strict";
import { productSchema } from "../lib/validators.ts";
import {
  normalizeOffers,
  computeLine,
  hasFreeDelivery,
} from "../lib/offers.ts";

const product = {
  slug: "carry-test",
  name_fr: "Sac",
  name_ar: "حقيبة",
  price: 7900,
  stock_quantity: 10,
  is_active: true,
  category: "autre",
  offers: [{ qty: 1, price: 7900, free_delivery: true }],
};

test("admin validation accepts free delivery for exactly one piece", () => {
  const result = productSchema.safeParse(product);
  assert.equal(result.success, true);
  assert.equal(result.data.offers[0].free_delivery, true);
});
test("one piece keeps its configured price and waives delivery", () => {
  const offers = normalizeOffers(product.offers);
  const line = computeLine(7900, offers, 1);
  assert.equal(line.subtotal, 7900);
  assert.equal(line.unitPrice, 7900);
  assert.equal(hasFreeDelivery(offers, 1), true);
  const delivery = line.offer?.free_delivery ? 0 : 600;
  assert.equal(line.subtotal + delivery, 7900);
});
test("quantity changes do not accidentally inherit single-piece free delivery", () => {
  const offers = normalizeOffers(product.offers);
  assert.equal(hasFreeDelivery(offers, 2), false);
  assert.equal(computeLine(7900, offers, 2).subtotal, 15800);
});
test("single-piece discounts without the free flag keep delivery payable", () => {
  const offers = normalizeOffers([
    { qty: 1, price: 7500, free_delivery: false },
  ]);
  const line = computeLine(7900, offers, 1);
  assert.equal(hasFreeDelivery(offers, 1), false);
  assert.equal(line.subtotal + (line.offer?.free_delivery ? 0 : 600), 8100);
});
test("products without offers retain ordinary pricing", () => {
  assert.deepEqual(computeLine(7900, [], 1), {
    subtotal: 7900,
    unitPrice: 7900,
  });
  assert.equal(hasFreeDelivery([], 1), false);
});
test("multi-piece offers and single-piece discounts still calculate correctly", () => {
  const offers = normalizeOffers([
    { qty: 1, price: 7500, free_delivery: true },
    { qty: 2, price: 14500, free_delivery: true },
  ]);
  assert.equal(computeLine(7900, offers, 1).subtotal, 7500);
  assert.equal(computeLine(7900, offers, 2).subtotal, 14500);
  assert.equal(hasFreeDelivery(offers, 2), true);
});
test("invalid quantities and duplicate offers remain guarded", () => {
  assert.equal(
    productSchema.safeParse({ ...product, offers: [{ qty: 0, price: 7900 }] })
      .success,
    false,
  );
  assert.equal(
    productSchema.safeParse({
      ...product,
      offers: [...product.offers, ...product.offers],
    }).success,
    false,
  );
  assert.deepEqual(
    normalizeOffers([
      { qty: 0, price: 10 },
      { qty: 100, price: 10 },
    ]),
    [],
  );
});
