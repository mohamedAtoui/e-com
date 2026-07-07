import { z } from "zod";

/** Algerian mobile: 0[5-7]XXXXXXXX (10 digits). Accepts spaces; normalize first. */
export const DZ_PHONE_RE = /^0(5|6|7)\d{8}$/;

export function normalizePhone(input: string): string {
  let v = input.replace(/[\s.\-()]/g, "");
  if (v.startsWith("+213")) v = "0" + v.slice(4);
  else if (v.startsWith("00213")) v = "0" + v.slice(5);
  else if (v.startsWith("213") && v.length === 12) v = "0" + v.slice(3);
  return v;
}

export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "Nom requis").max(120),
  customer_phone: z
    .string()
    .transform(normalizePhone)
    .refine((v) => DZ_PHONE_RE.test(v), "Numéro de téléphone invalide"),
  wilaya_code: z.coerce.number().int().min(1).max(99),
  commune_id: z.coerce.number().int().positive(),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  delivery_method: z.enum(["home", "stopdesk"]),
  quantity: z.coerce.number().int().min(1).max(99),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutValues = z.output<typeof checkoutSchema>;

/** Admin product create/edit. Prices are integer DZD. */
export const productSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (a-z, 0-9, tirets)"),
    name_fr: z.string().trim().min(2).max(160),
    name_ar: z.string().trim().min(2).max(160),
    description_fr: z.string().trim().max(5000).optional().or(z.literal("")),
    description_ar: z.string().trim().max(5000).optional().or(z.literal("")),
    price: z.coerce.number().int().min(0),
    compare_at_price: z.coerce.number().int().min(0).optional().nullable(),
    stock_quantity: z.coerce.number().int().min(0),
    is_active: z.boolean(),
    category: z.enum(["lampe", "suspension", "applique", "lanterne", "autre"]),
    images: z.array(z.string()).default([]),
    // Quantity bundle offers ("les promos"): N units for a fixed total price.
    offers: z
      .array(
        z.object({
          qty: z.coerce.number().int().min(2, "Quantité ≥ 2").max(99),
          price: z.coerce.number().int().min(0),
        }),
      )
      .default([]),
    // Rich description ("A+ content"): ordered heading / paragraph / image blocks.
    description_blocks: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            type: z.literal("heading"),
            fr: z.string().max(200).default(""),
            ar: z.string().max(200).default(""),
          }),
          z.object({
            type: z.literal("paragraph"),
            fr: z.string().max(5000).default(""),
            ar: z.string().max(5000).default(""),
          }),
          z.object({
            type: z.literal("image"),
            src: z.string().min(1).max(400),
            alt: z.string().max(200).default(""),
          }),
        ]),
      )
      .default([]),
  })
  .refine(
    (p) => p.compare_at_price == null || p.compare_at_price === 0 || p.compare_at_price > p.price,
    { path: ["compare_at_price"], message: "L'ancien prix doit être supérieur au prix" },
  )
  .refine((p) => new Set(p.offers.map((o) => o.qty)).size === p.offers.length, {
    path: ["offers"],
    message: "Quantités d'offres en double",
  });

export type ProductInput = z.input<typeof productSchema>;
export type ProductValues = z.output<typeof productSchema>;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
