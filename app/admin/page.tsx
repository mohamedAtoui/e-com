import {
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { guardPage } from "@/lib/admin-guard";
import { formatDZD } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { OrderStatusRow } from "@/types/database.types";

export const dynamic = "force-dynamic";

type ItemLite = {
  product_id: string;
  product_name_fr: string | null;
  quantity: number;
  unit_price: number;
};
type OrderLite = {
  id: string;
  order_number: number;
  customer_name: string;
  status: string;
  total: number;
  created_at: string;
  order_items: ItemLite[];
};

const DAY = 86_400_000;

export default async function DashboardPage() {
  await guardPage("dashboard");
  const supabase = await createClient();

  const [ordersRes, leadsRes, productsRes, statusesRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, customer_name, status, total, created_at, order_items(product_id, product_name_fr, quantity, unit_price)")
      .order("created_at", { ascending: false })
      .returns<OrderLite[]>(),
    supabase.from("checkout_leads").select("id, status"),
    supabase.from("products").select("id, name_fr, slug, stock_quantity, reserved_quantity, is_active"),
    supabase.from("order_statuses").select("*").order("sort_order"),
  ]);

  const orders = ordersRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const products = productsRes.data ?? [];
  const statuses = (statusesRes.data ?? []) as OrderStatusRow[];

  // "Lost" statuses never count as revenue.
  const LOST = new Set(["cancelled", "returned"]);
  const now = Date.now();
  const since = (days: number) => now - days * DAY;

  const inWindow = (o: OrderLite, days: number) =>
    new Date(o.created_at).getTime() >= since(days);

  const won = orders.filter((o) => !LOST.has(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const pipeline = won.filter((o) => o.status !== "delivered");

  const revenueDelivered = delivered.reduce((s, o) => s + o.total, 0);
  const revenuePipeline = pipeline.reduce((s, o) => s + o.total, 0);
  const aov = won.length ? Math.round(won.reduce((s, o) => s + o.total, 0) / won.length) : 0;

  const period = (days: number) => {
    const list = orders.filter((o) => inWindow(o, days));
    const kept = list.filter((o) => !LOST.has(o.status));
    return {
      orders: list.length,
      revenue: kept.reduce((s, o) => s + o.total, 0),
    };
  };
  const today = period(1);
  const week = period(7);
  const month = period(30);

  // Conversion: completed orders vs everyone who left a phone number.
  const activeLeads = leads.filter((l) => l.status === "active").length;
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const funnel = convertedLeads + activeLeads;
  const conversion = funnel ? Math.round((convertedLeads / funnel) * 100) : 0;

  // Units sold + revenue per product (won orders only).
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of won) {
    for (const it of o.order_items ?? []) {
      const cur = byProduct.get(it.product_id) ?? {
        name: it.product_name_fr ?? "Produit supprimé",
        qty: 0,
        revenue: 0,
      };
      cur.qty += it.quantity;
      cur.revenue += it.unit_price * it.quantity;
      byProduct.set(it.product_id, cur);
    }
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const lowStock = products
    .filter((p) => p.is_active && p.stock_quantity - p.reserved_quantity <= 5)
    .sort((a, b) => a.stock_quantity - a.reserved_quantity - (b.stock_quantity - b.reserved_quantity))
    .slice(0, 5);

  const recent = orders.slice(0, 8);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d&apos;ensemble de votre boutique</p>
      </div>

      {/* Headline KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Wallet}
          label="Chiffre d'affaires livré"
          value={formatDZD(revenueDelivered)}
          hint={`${delivered.length} commande(s) livrée(s)`}
          accent
        />
        <Stat
          icon={TrendingUp}
          label="En cours (non livré)"
          value={formatDZD(revenuePipeline)}
          hint={`${pipeline.length} commande(s) en cours`}
        />
        <Stat
          icon={ShoppingCart}
          label="Commandes"
          value={String(orders.length)}
          hint={`Panier moyen ${formatDZD(aov)}`}
        />
        <Stat
          icon={Users}
          label="Taux de conversion"
          value={`${conversion}%`}
          hint={`${convertedLeads} converties · ${activeLeads} abandonnées`}
        />
      </div>

      {/* Periods */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Period label="Aujourd'hui" orders={today.orders} revenue={today.revenue} />
        <Period label="7 derniers jours" orders={week.orders} revenue={week.revenue} />
        <Period label="30 derniers jours" orders={month.orders} revenue={month.revenue} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status breakdown */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-semibold">Commandes par statut</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune commande.</p>
          ) : (
            <div className="space-y-2">
              {statuses.map((s) => {
                const n = counts[s.key] ?? 0;
                const pct = orders.length ? Math.round((n / orders.length) * 100) : 0;
                return (
                  <Link
                    key={s.key}
                    href={`/admin/orders?status=${s.key}`}
                    className="flex items-center gap-3 rounded-lg px-1 py-1.5 transition hover:bg-muted/60"
                  >
                    <span className="w-28 shrink-0 text-sm">{s.label_fr}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${pct}%`, background: s.color }}
                      />
                    </span>
                    <span className="w-14 shrink-0 text-end text-sm font-semibold">{n}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Top products */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Package className="size-4" /> Meilleures ventes
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune vente pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {topProducts.map((p) => (
                <div key={p.name} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="shrink-0 text-muted-foreground">{p.qty} u.</span>
                  <span className="w-28 shrink-0 text-end font-semibold">{formatDZD(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Low stock */}
      {lowStock.length > 0 && (
        <section className="rounded-xl border border-[#F4B860]/50 bg-[#F4B860]/10 p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold text-[#9a6a1f]">
            <AlertTriangle className="size-4" /> Stock faible
          </h2>
          <div className="space-y-1.5">
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/admin/products/${p.id}/edit`} className="min-w-0 flex-1 truncate hover:underline">
                  {p.name_fr}
                </Link>
                <span className="shrink-0 font-semibold">
                  {p.stock_quantity - p.reserved_quantity} restant(s)
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent orders */}
      <section className="rounded-xl border">
        <header className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <h2 className="font-semibold">Dernières commandes</h2>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
            Tout voir →
          </Link>
        </header>
        {recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucune commande.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="font-mono hover:underline">
                        #{o.order_number}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{o.customer_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatDZD(o.total)}</TableCell>
                    <TableCell>
                      <StatusBadge status={o.status} statuses={statuses} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border p-4", accent && "border-[#3F8F2B]/40 bg-[#3F8F2B]/8")}>
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={cn("text-2xl font-bold", accent && "text-[#3F8F2B]")}>{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Period({ label, orders, revenue }: { label: string; orders: number; revenue: number }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{formatDZD(revenue)}</p>
      <p className="text-xs text-muted-foreground">{orders} commande(s)</p>
    </div>
  );
}
