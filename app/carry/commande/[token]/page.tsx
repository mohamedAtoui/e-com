import { notFound } from "next/navigation";
import { OrderConfirmation } from "@/components/storefront/order-confirmation";
import { getCommune, getWilaya } from "@/lib/algeria-data";
import { createPublicClient } from "@/lib/supabase/public";
import type { OrderSummary } from "@/types/database.types";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Votre commande — CARRY",
  robots: { index: false, follow: false },
};
export default async function CarryConfirmation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();
  const { data } = await createPublicClient().rpc("get_order_summary", {
    p_event_id: token,
  });
  const summary = data as OrderSummary;
  if (!summary) notFound();
  const locality = `${getCommune(summary.commune_id)?.name_fr ?? ""}, ${getWilaya(summary.wilaya_code)?.name_fr ?? summary.wilaya_code}`;
  return (
    <OrderConfirmation
      summary={summary}
      locality={locality}
      eventId={token}
      shopHref="/carry#collection"
    />
  );
}
