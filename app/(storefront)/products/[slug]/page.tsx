import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { type FeeInfo } from "@/components/storefront/checkout-form";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ViewContentTracker } from "@/components/storefront/view-content-tracker";
import { productImageUrl } from "@/lib/images";
import { createPublicClient } from "@/lib/supabase/public";
import type { ProductReviewRow } from "@/types/database.types";

export const revalidate = 60;

// cache() dedupes the fetch shared by generateMetadata + the page render.
const getProduct = cache(async (slug: string) => {
  const supabase = createPublicClient();
  const { data } = await supabase
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
  if (!product) return { title: "Produit introuvable" };
  return {
    title: `${product.name_fr} — Lighty`,
    description: product.description_fr ?? undefined,
    openGraph: {
      title: product.name_fr,
      images: product.images?.[0] ? [productImageUrl(product.images[0])] : undefined,
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

  const supabase = createPublicClient();
  // Reviews are optional: the table only exists once 0011 is applied, so a
  // failure here must degrade to "no reviews" rather than break the page.
  const [{ data: fees }, reviewsRes, { data: relatedRows }] = await Promise.all([
    supabase
      .from("delivery_fees")
      .select("wilaya_code, home_fee, stopdesk_fee, home_available, stopdesk_available"),
    supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", product.id)
      .eq("is_published", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("slug, name_fr, name_ar, price, compare_at_price, images, stock_quantity, reserved_quantity")
      .eq("is_active", true)
      .neq("slug", slug)
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const reviews = (reviewsRes.error ? [] : (reviewsRes.data ?? [])) as ProductReviewRow[];
  const related = relatedRows ?? [];

  const feeMap: Record<number, FeeInfo> = {};
  for (const f of fees ?? []) {
    feeMap[f.wilaya_code] = {
      home_fee: f.home_fee,
      stopdesk_fee: f.stopdesk_fee,
      home_available: f.home_available,
      stopdesk_available: f.stopdesk_available,
    };
  }

  // Product rich snippet. aggregateRating is emitted ONLY when real published
  // reviews exist — never fabricate ratings for Google.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name_fr,
    description: product.description_fr ?? undefined,
    image: product.images?.[0] ? [productImageUrl(product.images[0])] : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "DZD",
      availability:
        product.stock_quantity - product.reserved_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
  };
  if (reviews.length > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
      reviewCount: reviews.length,
    };
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewContentTracker productId={product.id} price={product.price} />
      <ProductDetail product={product} feeMap={feeMap} reviews={reviews} related={related} />
    </>
  );
}
