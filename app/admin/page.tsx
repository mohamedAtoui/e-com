import {
  AlertTriangle,
  MapPin,
  Package,
  ShoppingCart,
  Truck,
  TrendingUp,
  Undo2,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { DashboardFilters, type FilterOption } from "@/components/admin/dashboard-filters";
import { RevenueChart, type TrendPoint } from "@/components/admin/revenue-chart";
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
import { getWilaya } from "@/lib/algeria-data";
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
  subtotal: number;
  delivery_method: string;
  wilaya_code: number;
  created_at: string;
  order_items: ItemLite[];
};

const DAY = 86_400_000;
// Neither of these earns money, so both stay out of revenue. They are reported
// differently though: a return is a real loss (goods went out and came back),
// a cancellation is an order that simply never happened.
const NON_REVENUE = new Set(["cancelled", "returned"]);
const RETURNED = "returned";

/** Resolve the active window from either a preset range or explicit dates. */
function resolveWindow(range: string, from: string, to: string) {
  if (from || to) {
    const start = from ? new Date(`${from}T00:00:00`) : new Date(0);
    const end = to ? new Date(`${to}T23:59:59.999`) : new Date();
    return { start, end, label: `${from || "…"} → ${to || "…"}` };
  }
  const end = new Date();
  const preset: Record<string, number> = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
  if (range === "all") return { start: new Date(0), end, label: "Depuis le début" };
  const days = preset[range] ?? 30;
  const start = new Date(end.getTime() - days * DAY);
  const labels: Record<string, string> = {
    today: "Aujourd'hui",
    "7d": "7 derniers jours",
    "30d": "30 derniers jours",
    "90d": "90 derniers jours",
  };
  return { start, end, label: labels[range] ?? "30 derniers jours" };
}

/**
 * Continuous, zero-filled trend buckets. Granularity adapts to the span so the
 * chart never renders hundreds of bars: day → week → month.
 */
function buildTrend(
  orders: { created_at: string; total: number }[],
  start: Date,
  end: Date,
): TrendPoint[] {
  const spanDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / DAY));
  const grain: "day" | "week" | "month" = spanDays <= 45 ? "day" : spanDays <= 210 ? "week" : "month";

  const keyOf = (d: Date) => {
    if (grain === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (grain === "week") {
      const offset = Math.floor((d.getTime() - start.getTime()) / (7 * DAY));
      return `w${offset}`;
    }
    return d.toISOString().slice(0, 10);
  };

  const totals = new Map<string, { revenue: number; orders: number }>();
  for (const o of orders) {
    const k = keyOf(new Date(o.created_at));
    const cur = totals.get(k) ?? { revenue: 0, orders: 0 };
    cur.revenue += o.total;
    cur.orders += 1;
    totals.set(k, cur);
  }

  const points: TrendPoint[] = [];
  const cursor = new Date(start);
  const fmtShort = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" });
  const fmtFullDay = new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  const fmtMonth = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "2-digit" });
  const fmtMonthFull = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" });

  while (cursor <= end && points.length < 200) {
    const key = keyOf(cursor);
    const v = totals.get(key) ?? { revenue: 0, orders: 0 };
    points.push({
      key,
      label: grain === "month" ? fmtMonth.format(cursor) : fmtShort.format(cursor),
      full:
        grain === "month"
          ? fmtMonthFull.format(cursor)
          : grain === "week"
            ? `Semaine du ${fmtShort.format(cursor)}`
            : fmtFullDay.format(cursor),
      revenue: v.revenue,
      orders: v.orders,
    });
    if (grain === "month") cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + (grain === "week" ? 7 : 1));
  }
  return points;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await guardPage("dashboard");
  const sp = await searchParams;
  const range = sp.range ?? "30d";
  const win = resolveWindow(range, sp.from ?? "", sp.to ?? "");
  const productFilter = sp.product ?? "";
  const wilayaFilter = sp.wilaya ?? "";
  const statusFilter = sp.status ?? "";

  const supabase = await createClient();

  const [ordersRes, leadsRes, productsRes, statusesRes] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, order_number, customer_name, status, total, subtotal, delivery_method, wilaya_code, created_at, order_items(product_id, product_name_fr, quantity, unit_price)",
      )
      .is("deleted_at", null) // trashed orders count for nothing
      .gte("created_at", win.start.toISOString())
      .lte("created_at", win.end.toISOString())
      .order("created_at", { ascending: false })
      .returns<OrderLite[]>(),
    supabase.from("checkout_leads").select("id, status, product_id, created_at"),
    supabase.from("products").select("id, name_fr, slug, stock_quantity, reserved_quantity, is_active"),
    supabase.from("order_statuses").select("*").order("sort_order"),
  ]);

  const allProducts = productsRes.data ?? [];
  const statuses = (statusesRes.data ?? []) as OrderStatusRow[];

  // Apply the filters the DB can't express directly (product lives on items).
  let orders = ordersRes.data ?? [];
  if (productFilter) {
    orders = orders.filter((o) => (o.order_items ?? []).some((i) => i.product_id === productFilter));
  }
  if (wilayaFilter) orders = orders.filter((o) => String(o.wilaya_code) === wilayaFilter);
  if (statusFilter) orders = orders.filter((o) => o.status === statusFilter);

  let leads = (leadsRes.data ?? []).filter((l) => {
    const t = new Date(l.created_at as string).getTime();
    return t >= win.start.getTime() && t <= win.end.getTime();
  });
  if (productFilter) leads = leads.filter((l) => l.product_id === productFilter);

  // ---- KPIs -------------------------------------------------------------
  const won = orders.filter((o) => !NON_REVENUE.has(o.status));
  const delivered = orders.filter((o) => o.status === "delivered");
  const pipeline = won.filter((o) => o.status !== "delivered");
  const returned = orders.filter((o) => o.status === RETURNED);
  const cancelled = orders.filter((o) => o.status === "cancelled");

  const revenueDelivered = delivered.reduce((s, o) => s + o.total, 0);
  const revenuePipeline = pipeline.reduce((s, o) => s + o.total, 0);
  const revenueReturned = returned.reduce((s, o) => s + o.total, 0);
  const aov = won.length ? Math.round(won.reduce((s, o) => s + o.total, 0) / won.length) : 0;

  const unitsSold = won.reduce(
    (s, o) =>
      s +
      (o.order_items ?? [])
        .filter((i) => !productFilter || i.product_id === productFilter)
        .reduce((n, i) => n + i.quantity, 0),
    0,
  );

  // "Finalisées" = orders that reached an end state, so the delivery rate isn't
  // diluted by orders still in flight.
  const settled = delivered.length + returned.length + cancelled.length;
  const deliveryRate = settled ? Math.round((delivered.length / settled) * 100) : 0;
  const returnRate = delivered.length + returned.length
    ? Math.round((returned.length / (delivered.length + returned.length)) * 100)
    : 0;

  const activeLeads = leads.filter((l) => l.status === "active").length;
  const convertedLeads = leads.filter((l) => l.status === "converted").length;
  const funnel = convertedLeads + activeLeads;
  const conversion = funnel ? Math.round((convertedLeads / funnel) * 100) : 0;

  const homeCount = orders.filter((o) => o.delivery_method === "home").length;
  const deskCount = orders.filter((o) => o.delivery_method === "stopdesk").length;

  // ---- Trend: continuous, zero-filled buckets at an adaptive granularity --
  // "Tout" starts at the first real order so we never render years of zeros.
  const firstOrderAt = orders.length
    ? new Date(orders[orders.length - 1].created_at).getTime()
    : win.end.getTime();
  const chartStart = new Date(Math.max(win.start.getTime(), firstOrderAt));
  const trend = buildTrend(won, chartStart, win.end);

  // Same-length window immediately before, for the "vs période précédente" delta.
  const prevSpan = win.end.getTime() - chartStart.getTime();
  const prevFrom = new Date(chartStart.getTime() - prevSpan);
  const { data: prevRaw } = await supabase
    .from("orders")
    .select("status, total, wilaya_code, order_items(product_id)")
    .is("deleted_at", null)
    .gte("created_at", prevFrom.toISOString())
    .lt("created_at", chartStart.toISOString())
    .returns<{ status: string; total: number; wilaya_code: number; order_items: { product_id: string }[] }[]>();
  const prevOrders = (prevRaw ?? []).filter(
    (o) =>
      !NON_REVENUE.has(o.status) &&
      (!productFilter || (o.order_items ?? []).some((i) => i.product_id === productFilter)) &&
      (!wilayaFilter || String(o.wilaya_code) === wilayaFilter) &&
      (!statusFilter || o.status === statusFilter),
  );
  const previous = {
    revenue: prevOrders.reduce((s, o) => s + o.total, 0),
    orders: prevOrders.length,
  };

  // ---- Breakdowns -------------------------------------------------------
  const counts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});

  const byProduct = new Map<string, { name: string; qty: number; revenue: number; orders: number }>();
  for (const o of won) {
    for (const it of o.order_items ?? []) {
      if (productFilter && it.product_id !== productFilter) continue;
      const cur = byProduct.get(it.product_id) ?? {
        name: it.product_name_fr ?? "Produit supprimé",
        qty: 0,
        revenue: 0,
        orders: 0,
      };
      cur.qty += it.quantity;
      cur.revenue += it.unit_price * it.quantity;
      cur.orders += 1;
      byProduct.set(it.product_id, cur);
    }
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const byWilaya = new Map<number, { orders: number; revenue: number }>();
  for (const o of won) {
    const cur = byWilaya.get(o.wilaya_code) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += o.total;
    byWilaya.set(o.wilaya_code, cur);
  }
  const topWilayas = [...byWilaya.entries()]
    .map(([code, v]) => ({ code, name: getWilaya(code)?.name_fr ?? String(code), ...v }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 6);

  const lowStock = allProducts
    .filter((p) => p.is_active && p.stock_quantity - p.reserved_quantity <= 5)
    .sort((a, b) => a.stock_quantity - a.reserved_quantity - (b.stock_quantity - b.reserved_quantity))
    .slice(0, 5);

  const recent = orders.slice(0, 10);

  const productOptions: FilterOption[] = allProducts.map((p) => ({ value: p.id, label: p.name_fr }));
  const wilayaOptions: FilterOption[] = [...new Set((ordersRes.data ?? []).map((o) => o.wilaya_code))]
    .map((c) => ({ value: String(c), label: getWilaya(c)?.name_fr ?? String(c) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  const statusOptions: FilterOption[] = statuses.map((s) => ({ value: s.key, label: s.label_fr }));

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">
          {win.label}
          {productFilter && " · produit filtré"}
          {wilayaFilter && ` · ${getWilaya(Number(wilayaFilter))?.name_fr ?? wilayaFilter}`}
          {statusFilter && ` · ${statuses.find((s) => s.key === statusFilter)?.label_fr ?? statusFilter}`}
          {" · "}
          {orders.length} commande(s)
        </p>
      </div>

      <DashboardFilters products={productOptions} wilayas={wilayaOptions} statuses={statusOptions} />

      {/* Money */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label="CA livré" value={formatDZD(revenueDelivered)} hint={`${delivered.length} livrée(s)`} accent />
        <Stat icon={TrendingUp} label="En cours" value={formatDZD(revenuePipeline)} hint={`${pipeline.length} en cours`} />
        <Stat
          icon={Undo2}
          label="Retours"
          value={formatDZD(revenueReturned)}
          hint={`${returned.length} retour(s) · ${returnRate}% des livraisons`}
        />
        <Stat icon={ShoppingCart} label="Panier moyen" value={formatDZD(aov)} hint={`${unitsSold} unité(s) vendue(s)`} />
      </div>

      {/* Performance */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Truck} label="Taux de livraison" value={`${deliveryRate}%`} hint={`${delivered.length}/${settled} finalisée(s)`} />
        <Stat icon={Users} label="Taux de conversion" value={`${conversion}%`} hint={`${convertedLeads} converties · ${activeLeads} abandonnées`} />
        <Stat icon={Package} label="Commandes" value={String(orders.length)} hint={`${won.length} valides`} />
        <Stat
          icon={MapPin}
          label="Mode de livraison"
          value={`${homeCount} / ${deskCount}`}
          hint="Domicile / Stop desk"
        />
      </div>

      <RevenueChart points={trend} previous={previous} />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Statuses */}
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
                      <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: s.color }} />
                    </span>
                    <span className="w-16 shrink-0 text-end text-sm font-semibold">
                      {n} <span className="text-xs font-normal text-muted-foreground">{pct}%</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Top wilayas */}
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <MapPin className="size-4" /> Meilleures wilayas
          </h2>
          {topWilayas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <div className="space-y-2">
              {topWilayas.map((w) => (
                <div key={w.code} className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 flex-1 truncate">
                    {w.code} · {w.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">{w.orders} cmd</span>
                  <span className="w-28 shrink-0 text-end font-semibold">{formatDZD(w.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Products */}
      <section className="rounded-xl border p-4">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Package className="size-4" /> Produits les plus vendus
        </h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune vente sur cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead className="text-right">Unités</TableHead>
                  <TableHead className="text-right">Lignes</TableHead>
                  <TableHead className="text-right">CA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topProducts.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-right">{p.qty}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{p.orders}</TableCell>
                    <TableCell className="text-right font-semibold">{formatDZD(p.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

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

      {/* Recent */}
      <section className="rounded-xl border">
        <header className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
          <h2 className="font-semibold">Dernières commandes</h2>
          <Link href="/admin/orders" className="text-sm text-muted-foreground hover:text-foreground">
            Tout voir →
          </Link>
        </header>
        {recent.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Aucune commande sur cette période.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Wilaya</TableHead>
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
                      {getWilaya(o.wilaya_code)?.name_fr ?? o.wilaya_code}
                    </TableCell>
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
