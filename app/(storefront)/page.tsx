import { Landing } from "@/components/storefront/landing";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 60;

export default async function LandingPage() {
  const supabase = createPublicClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "slug, name_fr, name_ar, price, compare_at_price, images, stock_quantity, reserved_quantity",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return <Landing products={products ?? []} />;
}
