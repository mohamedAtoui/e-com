"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export interface ReviewActionState {
  ok: boolean;
  error?: string;
}

export interface ReviewInput {
  id?: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment_fr?: string | null;
  comment_ar?: string | null;
  image_path?: string | null;
  is_published: boolean;
  sort_order: number;
}

function friendly(message: string): string {
  if (message.includes("product_reviews") && message.includes("does not exist"))
    return "Table des avis absente — appliquez la migration 0011.";
  return "Une erreur est survenue.";
}

export async function saveReview(input: ReviewInput): Promise<ReviewActionState> {
  const name = input.author_name.trim();
  if (!name) return { ok: false, error: "Nom requis." };
  const rating = Math.min(5, Math.max(1, Math.trunc(input.rating)));

  const supabase = await createClient();
  const row = {
    product_id: input.product_id,
    author_name: name,
    rating,
    comment_fr: input.comment_fr?.trim() || null,
    comment_ar: input.comment_ar?.trim() || null,
    image_path: input.image_path || null,
    is_published: input.is_published,
    sort_order: input.sort_order,
  };

  const { error } = input.id
    ? await supabase.from("product_reviews").update(row).eq("id", input.id)
    : await supabase.from("product_reviews").insert(row);

  if (error) return { ok: false, error: friendly(error.message) };

  revalidatePath(`/admin/products/${input.product_id}/edit`);
  revalidatePath("/products", "layout");
  return { ok: true };
}

export async function deleteReview(id: string, productId: string): Promise<ReviewActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("product_reviews").delete().eq("id", id);
  if (error) return { ok: false, error: friendly(error.message) };
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products", "layout");
  return { ok: true };
}
