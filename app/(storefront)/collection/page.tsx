import { CollectionView } from "@/components/storefront/collection-view";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "slug, name_fr, name_ar, price, compare_at_price, images, stock_quantity, reserved_quantity",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return <CollectionView products={products ?? []} />;
}
