import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BilingualText } from "@/components/storefront/bilingual-text";
import { CheckoutForm, type FeeInfo } from "@/components/storefront/checkout-form";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ViewContentTracker } from "@/components/storefront/view-content-tracker";
import { Badge } from "@/components/ui/badge";
import { formatDZD } from "@/lib/money";
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
    title: product.name_fr,
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

  const available = product.stock_quantity - product.reserved_quantity;
  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ViewContentTracker productId={product.id} price={product.price} />
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} alt={product.name_fr} />

        <div className="flex flex-col gap-5">
          <div>
            <BilingualText
              fr={product.name_fr}
              ar={product.name_ar}
              as="h1"
              className="text-2xl font-bold sm:text-3xl"
              arClassName="mt-1 text-lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">
              {formatDZD(product.price)}
            </span>
            {onSale && (
              <span className="text-lg text-muted-foreground line-through">
                {formatDZD(product.compare_at_price!)}
              </span>
            )}
            {available > 0 ? (
              <Badge variant="secondary">En stock</Badge>
            ) : (
              <Badge variant="destructive">Rupture de stock</Badge>
            )}
          </div>

          {(product.description_fr || product.description_ar) && (
            <div className="space-y-3 text-sm leading-relaxed">
              {product.description_fr && (
                <p className="whitespace-pre-line">{product.description_fr}</p>
              )}
              {product.description_ar && (
                <p className="whitespace-pre-line font-arabic text-muted-foreground" dir="rtl" lang="ar">
                  {product.description_ar}
                </p>
              )}
            </div>
          )}

          {available > 0 ? (
            <CheckoutForm
              productId={product.id}
              price={product.price}
              deliveryFees={feeMap}
            />
          ) : (
            <div className="rounded-xl border bg-muted/40 p-5 text-center text-muted-foreground">
              Ce produit est actuellement en rupture de stock.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
