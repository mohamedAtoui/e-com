import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { type FeeInfo } from "@/components/storefront/checkout-form";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ViewContentTracker } from "@/components/storefront/view-content-tracker";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

async function getProduct(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Produit introuvable" };
  return {
    title: `${product.name_fr} — Lighty`,
    description: product.description_fr ?? undefined,
    openGraph: {
      title: product.name_fr,
      images: product.images?.[0] ? [product.images[0]] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const supabase = await createClient();
  const { data: fees } = await supabase
    .from("delivery_fees")
    .select("wilaya_code, home_fee, stopdesk_fee, home_available, stopdesk_available");

  const feeMap: Record<number, FeeInfo> = {};
  for (const f of fees ?? []) {
    feeMap[f.wilaya_code] = {
      home_fee: f.home_fee,
      stopdesk_fee: f.stopdesk_fee,
      home_available: f.home_available,
      stopdesk_available: f.stopdesk_available,
    };
  }

  return (
    <>
      <ViewContentTracker productId={product.id} price={product.price} />
      <ProductDetail product={product} feeMap={feeMap} />
    </>
  );
}
