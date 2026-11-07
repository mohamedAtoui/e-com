import type { Metadata } from "next";
import { CarryProduct } from "@/components/carry/product";
import type { ProductRow } from "@/types/database.types";
import { CARRY_PREVIEW_PRICE } from "@/lib/carry-preview";

export const metadata: Metadata = {
  title: "Aperçu produit — CARRY",
  robots: { index: false, follow: false },
};

// Visual preview only. Never persisted, tracked as a product, or passed to checkout.
const demo: ProductRow = {
  id: "preview",
  slug: "carry-demo",
  name_fr: "Sac à dos | Collection CARRY",
  name_ar: "حقيبة ظهر | مجموعة CARRY",
  description_fr:
    "Une page pensée pour votre produit : de grandes images, les détails qui comptent et une commande simple, sans paiement en ligne. Ajoutez vos propres photos et descriptions depuis l’administration.",
  description_ar:
    "صفحة مخصصة لمنتجك: صور كبيرة، تفاصيل واضحة وطلب سهل بدون دفع عبر الإنترنت. أضف صورك ووصفك من لوحة الإدارة.",
  price: CARRY_PREVIEW_PRICE,
  compare_at_price: null,
  stock_quantity: 0,
  reserved_quantity: 0,
  is_active: false,
  category: "autre",
  images: [],
  offers: [],
  description_blocks: [],
  created_at: "",
  updated_at: "",
};
export default function CarryPreview() {
  return <CarryProduct product={demo} preview />;
}
