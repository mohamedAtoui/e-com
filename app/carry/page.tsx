import { CarryLanding } from "@/components/carry/landing";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 60;

export default async function CarryPage() {
  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("is_active", true)
    .like("slug", "carry-%")
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      "Impossible de charger la collection. Réessayez dans un instant.",
    );
  return <CarryLanding products={data ?? []} />;
}
