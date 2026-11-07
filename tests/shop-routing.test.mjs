import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(
  new URL("../lib/shop-routing.ts", import.meta.url),
  "utf8",
);
const js = ts.transpile(source, { module: ts.ModuleKind.ESNext });
const { isCarryProduct, slugForShop, productHref } = await import(
  `data:text/javascript;base64,${Buffer.from(js).toString("base64")}`
);

test("separates the existing lighting catalog from CARRY", () => {
  assert.equal(isCarryProduct("carry-weekender"), true);
  assert.equal(isCarryProduct("lamp-carry-case"), false);
  assert.equal(isCarryProduct(""), false);
  assert.equal(productHref("lampe-nora"), "/products/lampe-nora");
  assert.equal(
    productHref("carry-weekender"),
    "/carry/products/carry-weekender",
  );
});
test("switching storefronts normalizes prefixes without accumulating them", () => {
  assert.equal(slugForShop("weekender", "carry"), "carry-weekender");
  assert.equal(slugForShop("carry-weekender", "carry"), "carry-weekender");
  assert.equal(
    slugForShop("carry-carry-weekender", "carry"),
    "carry-weekender",
  );
  assert.equal(slugForShop("carry-weekender", "lighty"), "weekender");
  assert.equal(slugForShop("", "carry"), "");
});
