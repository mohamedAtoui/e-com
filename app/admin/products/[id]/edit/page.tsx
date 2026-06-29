import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Modifier le produit</h1>
      <ProductForm initial={product} />
    </div>
  );
}
