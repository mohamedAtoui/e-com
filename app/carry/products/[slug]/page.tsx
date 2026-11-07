import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarryProduct } from "@/components/carry/product";
import { ViewContentTracker } from "@/components/storefront/view-content-tracker";
import type { FeeInfo } from "@/components/storefront/checkout-form";
import { createPublicClient } from "@/lib/supabase/public";
import { isCarryProduct, productHref } from "@/lib/shop-routing";
import { productImageUrl } from "@/lib/images";

export const revalidate = 60;
const getProduct = cache(async (slug: string) => {
  if (!isCarryProduct(slug)) return null;
  const { data } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
});
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produit introuvable — CARRY" };
  return {
    title: `${product.name_fr} — CARRY`,
    description: product.description_fr || undefined,
    alternates: { canonical: productHref(slug) },
    openGraph: {
      title: product.name_fr,
      images: product.images[0]
        ? [productImageUrl(product.images[0])]
        : undefined,
    },
  };
}
export default async function CarryProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const client = createPublicClient();
  const fees = await client
    .from("delivery_fees")
    .select(
      "wilaya_code,home_fee,stopdesk_fee,home_available,stopdesk_available",
    );
  const feeMap: Record<number, FeeInfo> = {};
  for (const f of fees.data ?? []) feeMap[f.wilaya_code] = f;
  return (
    <>
      <ViewContentTracker productId={product.id} price={product.price} />
      <CarryProduct product={product} feeMap={feeMap} />
    </>
  );
}
