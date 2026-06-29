import { ProductCard } from "@/components/storefront/product-card";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select(
      "slug, name_fr, name_ar, price, compare_at_price, images, stock_quantity, reserved_quantity",
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Nos produits
        </h1>
        <p className="mt-2 text-muted-foreground" dir="rtl" lang="ar">
          ادفع عند الاستلام — توصيل إلى جميع الولايات
        </p>
      </section>

      {!products || products.length === 0 ? (
        <p className="py-20 text-center text-muted-foreground">
          Aucun produit disponible pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
