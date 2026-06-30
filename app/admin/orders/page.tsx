import Link from "next/link";

import { OrderStatusControl } from "@/components/admin/order-status-control";
import { StatusBadge } from "@/components/admin/status-badge";
import { buttonVariants } from "@/components/ui/button";
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
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { OrderRow, OrderStatus } from "@/types/database.types";

export const dynamic = "force-dynamic";

type OrderItemLite = {
  product_id: string;
  product_name_fr: string | null;
  product_name_ar: string | null;
  quantity: number;
};
type OrderWithItems = OrderRow & { order_items: OrderItemLite[] };

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = ORDER_STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select(
      "*, order_items(product_id, product_name_fr, product_name_ar, quantity)",
    )
    .order("created_at", { ascending: false });
  if (activeStatus) query = query.eq("status", activeStatus);

  const { data } = await query.returns<OrderWithItems[]>();
  const orders = data ?? [];

  // status counts for the filter bar
  const { data: allStatuses } = await supabase.from("orders").select("status");
  const counts = (allStatuses ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalCount = allStatuses?.length ?? 0;

  // group orders by their (first) product
  const groups = new Map<
    string,
    { name_fr: string; name_ar: string | null; orders: OrderWithItems[] }
  >();
  for (const o of orders) {
    const item = o.order_items[0];
    const key = item?.product_id ?? "—";
    if (!groups.has(key)) {
      groups.set(key, {
        name_fr: item?.product_name_fr ?? "Produit supprimé",
        name_ar: item?.product_name_ar ?? null,
        orders: [],
      });
    }
    groups.get(key)!.orders.push(o);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Commandes</h1>
        <p className="text-sm text-muted-foreground">Regroupées par produit</p>
      </div>

      {/* status filter bar */}
      <div className="flex flex-wrap gap-2">
        <FilterPill href="/admin/orders" label="Toutes" count={totalCount} active={!activeStatus} />
        {ORDER_STATUSES.map((s) => (
          <FilterPill
            key={s}
            href={`/admin/orders?status=${s}`}
            label={STATUS_LABELS[s]}
            count={counts[s] ?? 0}
            active={activeStatus === s}
          />
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">Aucune commande.</p>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([productId, group]) => (
            <section key={productId} className="rounded-xl border">
              <header className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                <div>
                  <h2 className="font-semibold">{group.name_fr}</h2>
                  {group.name_ar && (
                    <span className="font-arabic text-sm text-muted-foreground" dir="rtl">
                      {group.name_ar}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {group.orders.length} commande(s)
                </span>
              </header>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Localité</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">
                            #{o.order_number}
                          </Link>
                        </TableCell>
                        <TableCell className="font-medium">{o.customer_name}</TableCell>
                        <TableCell>
                          <a href={`tel:${o.customer_phone}`} className="hover:underline">
                            {o.customer_phone}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getCommune(o.commune_id)?.name_fr ?? "?"},{" "}
                          {getWilaya(o.wilaya_code)?.name_fr ?? o.wilaya_code}
                        </TableCell>
                        <TableCell className="text-right">
                          {o.order_items.reduce((s, i) => s + i.quantity, 0)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDZD(o.total)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} />
                        </TableCell>
                        <TableCell>
                          <OrderStatusControl orderId={o.id} status={o.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
        !active && "text-muted-foreground",
      )}
    >
      {label}
      <span className="ms-1.5 rounded bg-background/20 px-1.5 text-xs">{count}</span>
    </Link>
  );
}
