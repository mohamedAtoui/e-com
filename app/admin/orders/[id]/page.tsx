import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusControl } from "@/components/admin/order-status-control";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCommune, getWilaya } from "@/lib/algeria-data";
import { formatDZD } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { OrderItemRow, OrderRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

type OrderDetail = OrderRow & { order_items: OrderItemRow[] };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", id)
    .single<OrderDetail>();

  if (!data) notFound();

  const wilaya = getWilaya(data.wilaya_code);
  const commune = getCommune(data.commune_id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Retour aux commandes
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Commande #{data.order_number}</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(data.created_at).toLocaleString("fr-FR")}
          </p>
        </div>
        <StatusBadge status={data.status} className="text-sm" />
      </div>

      <div className="rounded-xl border p-4">
        <h2 className="mb-3 font-semibold">Mettre à jour le statut</h2>
        <OrderStatusControl orderId={data.id} status={data.status} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard title="Client">
          <p className="font-medium">{data.customer_name}</p>
          <a href={`tel:${data.customer_phone}`} className="text-primary hover:underline">
            {data.customer_phone}
          </a>
        </InfoCard>
        <InfoCard title="Livraison">
          <p>
            {data.delivery_method === "home" ? "À domicile" : "Au bureau (Stop Desk)"}
          </p>
          <p className="text-sm text-muted-foreground">
            {commune?.name_fr ?? data.commune_id}, {wilaya?.name_fr ?? data.wilaya_code} (
            {data.wilaya_code})
          </p>
          {data.address && <p className="text-sm text-muted-foreground">{data.address}</p>}
        </InfoCard>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead className="text-right">PU</TableHead>
              <TableHead className="text-right">Qté</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.order_items.map((it) => (
              <TableRow key={it.id}>
                <TableCell>
                  {it.product_name_fr}
                  {it.product_name_ar && (
                    <span className="block font-arabic text-xs text-muted-foreground" dir="rtl">
                      {it.product_name_ar}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">{formatDZD(it.unit_price)}</TableCell>
                <TableCell className="text-right">{it.quantity}</TableCell>
                <TableCell className="text-right">
                  {formatDZD(it.unit_price * it.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="space-y-1 border-t p-4 text-sm">
          <Line label="Sous-total" value={formatDZD(data.subtotal)} />
          <Line label="Livraison" value={formatDZD(data.delivery_fee)} />
          <Line label="Total" value={formatDZD(data.total)} strong />
        </div>
      </div>

      {data.notes && (
        <InfoCard title="Notes internes">
          <p className="whitespace-pre-line text-sm">{data.notes}</p>
        </InfoCard>
      )}
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-4">
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between text-base font-semibold" : "flex justify-between"}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
