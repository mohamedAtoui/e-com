import { notFound } from "next/navigation";

import { OrderConfirmation } from "@/components/storefront/order-confirmation";
import { getCommune, getWilaya } from "@/lib/algeria-data";
import { createPublicClient } from "@/lib/supabase/public";
import type { OrderSummary } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // UUID guard — the token is the order's unguessable meta_event_id.
  if (!/^[0-9a-f-]{36}$/i.test(token)) notFound();

  const supabase = createPublicClient();
  const { data } = await supabase.rpc("get_order_summary", { p_event_id: token });
  const summary = data as OrderSummary;
  if (!summary) notFound();

  const commune = getCommune(summary.commune_id)?.name_fr ?? "";
  const wilaya = getWilaya(summary.wilaya_code)?.name_fr ?? String(summary.wilaya_code);
  const locality = `${commune}, ${wilaya}`;

  return <OrderConfirmation summary={summary} locality={locality} />;
}
