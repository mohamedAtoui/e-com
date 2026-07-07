"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { productSchema } from "@/lib/validators";

export interface ProductActionState {
  ok: boolean;
  error?: string;
  id?: string;
}

function friendlyError(message: string): string {
  if (message.includes("duplicate key") && message.includes("slug"))
    return "Ce slug existe déjà. Choisissez-en un autre.";
  if (message.includes("violates foreign key") || message.includes("still referenced"))
    return "Impossible : ce produit a des commandes. Désactivez-le plutôt.";
  return "Une erreur est survenue.";
}

export async function createProduct(raw: unknown): Promise<ProductActionState> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const v = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      slug: v.slug,
      name_fr: v.name_fr,
      name_ar: v.name_ar,
      description_fr: v.description_fr || null,
      description_ar: v.description_ar || null,
      price: v.price,
      compare_at_price: v.compare_at_price || null,
      stock_quantity: v.stock_quantity,
      is_active: v.is_active,
      category: v.category,
      images: v.images,
      offers: v.offers,
      description_blocks: v.description_blocks,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true, id: data.id };
}

export async function updateProduct(
  id: string,
  raw: unknown,
): Promise<ProductActionState> {
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  const v = parsed.data;

  const supabase = await createClient();

  // Record a manual stock movement if the on-hand quantity changed.
  const { data: current } = await supabase
    .from("products")
    .select("stock_quantity")
    .eq("id", id)
    .single();
  const delta = current ? v.stock_quantity - current.stock_quantity : 0;

  const { error } = await supabase
    .from("products")
    .update({
      slug: v.slug,
      name_fr: v.name_fr,
      name_ar: v.name_ar,
      description_fr: v.description_fr || null,
      description_ar: v.description_ar || null,
      price: v.price,
      compare_at_price: v.compare_at_price || null,
      stock_quantity: v.stock_quantity,
      is_active: v.is_active,
      category: v.category,
      images: v.images,
      offers: v.offers,
      description_blocks: v.description_blocks,
    })
    .eq("id", id);

  if (error) return { ok: false, error: friendlyError(error.message) };

  if (delta !== 0) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("stock_movements")
      .insert({ product_id: id, delta, type: "manual", created_by: user?.id ?? null });
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}/edit`);
  revalidatePath("/");
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ProductActionState> {
  const supabase = await createClient();

  // Fetch image paths so we can clean up Storage after the row is deleted.
  const { data: product } = await supabase
    .from("products")
    .select("images")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };

  // Remove orphaned image files (best-effort; row deletion already succeeded).
  const images = product?.images ?? [];
  if (images.length > 0) {
    await supabase.storage.from("product-images").remove(images);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  return { ok: true };
}
