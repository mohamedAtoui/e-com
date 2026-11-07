/** Storefront membership uses the existing unique slug: no schema change. */
export const CARRY_PREFIX = "carry-";
export type Shop = "lighty" | "carry";

export function isCarryProduct(slug: string): boolean {
  return slug.startsWith(CARRY_PREFIX);
}

export function slugForShop(slug: string, shop: Shop): string {
  const base = slug.replace(/^(carry-)+/, "");
  return base ? (shop === "carry" ? `${CARRY_PREFIX}${base}` : base) : "";
}

export function productHref(slug: string): string {
  return `${isCarryProduct(slug) ? "/carry" : ""}/products/${encodeURIComponent(slug)}`;
}
