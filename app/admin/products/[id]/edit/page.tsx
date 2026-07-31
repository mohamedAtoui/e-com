import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { ProductReviewsEditor } from "@/components/admin/product-reviews-editor";
import { createClient } from "@/lib/supabase/server";
import type { ProductReviewRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  // Optional until migration 0011 is applied — never break the edit page.
  const reviewsRes = await supabase
    .from("product_reviews")
    .select("*")
    .eq("product_id", id)
    .order("sort_order")
    .order("created_at", { ascending: false });
  const reviews = (reviewsRes.error ? [] : (reviewsRes.data ?? [])) as ProductReviewRow[];

  return (
    <div className="space-y-8 p-6">
      <h1 className="text-2xl font-bold">Modifier le produit</h1>
      <ProductForm initial={product} />
      <div className="border-t pt-6">
        <ProductReviewsEditor productId={id} reviews={reviews} />
      </div>
    </div>
  );
}
