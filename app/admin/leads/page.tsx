import { LeadsTable, type LeadView } from "@/components/admin/leads-table";
import { getCommune, getWilaya } from "@/lib/algeria-data";
import { createClient } from "@/lib/supabase/server";
import type { CheckoutLeadRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

type LeadRow = CheckoutLeadRow & { products: { name_fr: string } | null };

export default async function LeadsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("checkout_leads")
    .select("*, products(name_fr)")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .returns<LeadRow[]>();

  const leads: LeadView[] = (data ?? []).map((l) => {
    const commune = l.commune_id ? getCommune(l.commune_id)?.name_fr : null;
    const wilaya = l.wilaya_code ? (getWilaya(l.wilaya_code)?.name_fr ?? String(l.wilaya_code)) : null;
    const locality = [commune, wilaya].filter(Boolean).join(", ") || "—";
    return {
      id: l.id,
      customer_name: l.customer_name,
      customer_phone: l.customer_phone,
      product_name: l.products?.name_fr ?? null,
      locality,
      quantity: l.quantity,
      updated_at: l.updated_at,
    };
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Paniers abandonnés</h1>
        <p className="text-sm text-muted-foreground">
          Commandes commencées mais non validées. Rappelez le client pour conclure la vente.
        </p>
      </div>

      {leads.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Aucun panier abandonné pour le moment.</p>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
