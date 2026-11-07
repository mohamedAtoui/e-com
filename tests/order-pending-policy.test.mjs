import assert from "node:assert/strict";
import { test } from "node:test";
import { ensureManualPendingStatus, protectPendingOrder, isRequiredOrderStatus } from "../lib/order-pending-policy.ts";

function fixture({ stockEffect = "reserved", failures = 0 } = {}) {
  const rows = [{ id: "waiting", status: "pending", ageHours: 12 },
    { id: "confirmed", status: "confirmed", ageHours: 12 }];
  let attempts = 0;
  const inventory = { physical: 10, reserved: 1 };
  const admin = { from(table) {
    if (table === "order_statuses") return {
      upsert: async () => ({ error: null }),
      select: () => ({ eq: () => ({ single: async () => ({ data: { stock_effect: stockEffect }, error: null }) }) }),
    };
    assert.equal(table, "orders");
    return { update(patch) {
      const filters = [];
      const query = {
        eq(key, value) { filters.push([key, value]); return query; },
        then(resolve, reject) {
          attempts++;
          const error = attempts <= failures ? { message: "transient failure" } : null;
          if (!error) for (const row of rows) {
            if (filters.every(([key, value]) => row[key] === value)) Object.assign(row, patch);
          }
          return Promise.resolve({ error }).then(resolve, reject);
        },
      };
      return query;
    } };
  } };
  return { admin, rows, inventory, attempts: () => attempts };
}

test("waiting orders survive the legacy expiry predicate, without moving stock", async () => {
  const f = fixture();
  await ensureManualPendingStatus(f.admin);
  await protectPendingOrder(f.admin, "waiting");
  await protectPendingOrder(f.admin, "waiting");
  for (const row of f.rows) if (row.status === "pending" && row.ageHours > 2) row.status = "cancelled";
  assert.equal(f.rows[0].status, "awaiting_confirmation");
  assert.deepEqual(f.inventory, { physical: 10, reserved: 1 });
});

test("protection cannot overwrite a concurrent manual confirmation", async () => {
  const f = fixture();
  await protectPendingOrder(f.admin, "confirmed");
  assert.equal(f.rows[1].status, "confirmed");
});

test("transient failures retry the protection write, not order creation", async () => {
  const f = fixture({ failures: 2 });
  await protectPendingOrder(f.admin, "waiting");
  assert.equal(f.attempts(), 3);
  assert.equal(f.rows[0].status, "awaiting_confirmation");
});

test("persistent protection failures are surfaced", async () => {
  const f = fixture({ failures: 3 });
  await assert.rejects(protectPendingOrder(f.admin, "waiting"), /Could not protect order/);
});

test("invalid stock configuration is rejected before checkout", async () => {
  await assert.rejects(ensureManualPendingStatus(fixture({ stockEffect: "none" }).admin), /reserve stock/);
  assert.equal(isRequiredOrderStatus("awaiting_confirmation"), true);
  assert.equal(isRequiredOrderStatus("pending"), true);
  assert.equal(isRequiredOrderStatus("cancelled"), false);
});
