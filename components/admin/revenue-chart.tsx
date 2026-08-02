"use client";

import { BarChart3, LineChart, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

import { formatDZD } from "@/lib/money";
import { cn } from "@/lib/utils";

export interface TrendPoint {
  /** Bucket key (YYYY-MM-DD / YYYY-Www / YYYY-MM). */
  key: string;
  /** Short axis label. */
  label: string;
  /** Full label used in the tooltip. */
  full: string;
  revenue: number;
  orders: number;
}

type Metric = "revenue" | "orders" | "aov";
type Mode = "bars" | "line";

const METRICS: { value: Metric; label: string }[] = [
  { value: "revenue", label: "Chiffre d'affaires" },
  { value: "orders", label: "Commandes" },
  { value: "aov", label: "Panier moyen" },
];

const valueOf = (p: TrendPoint, m: Metric) =>
  m === "revenue" ? p.revenue : m === "orders" ? p.orders : p.orders ? Math.round(p.revenue / p.orders) : 0;

const fmt = (v: number, m: Metric) => (m === "orders" ? String(v) : formatDZD(v));

/** Compact axis labels: 12 500 → 12,5k */
function short(v: number, m: Metric) {
  if (m === "orders") return String(v);
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(v >= 10_000 ? 0 : 1).replace(".0", "")}k`;
  return String(v);
}

export function RevenueChart({
  points,
  previous,
}: {
  points: TrendPoint[];
  /** Same-length window immediately before, for the delta. */
  previous?: { revenue: number; orders: number };
}) {
  const [metric, setMetric] = useState<Metric>("revenue");
  const [mode, setMode] = useState<Mode>("bars");
  const [hover, setHover] = useState<number | null>(null);

  const values = points.map((p) => valueOf(p, metric));
  const max = Math.max(1, ...values);
  const total = metric === "orders"
    ? points.reduce((s, p) => s + p.orders, 0)
    : metric === "revenue"
      ? points.reduce((s, p) => s + p.revenue, 0)
      : (() => {
          const o = points.reduce((s, p) => s + p.orders, 0);
          return o ? Math.round(points.reduce((s, p) => s + p.revenue, 0) / o) : 0;
        })();

  const prevTotal = previous
    ? metric === "orders"
      ? previous.orders
      : metric === "revenue"
        ? previous.revenue
        : previous.orders
          ? Math.round(previous.revenue / previous.orders)
          : 0
    : undefined;
  const delta =
    prevTotal !== undefined && prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : undefined;

  // 5 gridlines, top → bottom. Small integer scales (e.g. max = 2 orders) would
  // repeat labels after rounding, so blank the duplicates and keep the lines.
  const rawTicks = [1, 0.75, 0.5, 0.25, 0].map((f) => Math.round(max * f));
  const ticks = rawTicks.map((t, i) => (i > 0 && t === rawTicks[i - 1] ? null : t));

  // Show ~7 x labels max so they never collide.
  const step = Math.max(1, Math.ceil(points.length / 7));

  const n = points.length;
  const x = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const y = (v: number) => 100 - (v / max) * 100;
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(valueOf(p, metric))}`).join(" ");
  const areaPath = n ? `${linePath} L 100 100 L 0 100 Z` : "";

  return (
    <section className="rounded-xl border p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Évolution</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-bold">{fmt(total, metric)}</span>
            {delta !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  delta >= 0 ? "bg-[#3F8F2B]/12 text-[#3F8F2B]" : "bg-destructive/10 text-destructive",
                )}
                title="vs période précédente"
              >
                {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric switch */}
          <div className="flex rounded-lg bg-muted p-0.5">
            {METRICS.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMetric(m.value)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[12px] font-medium transition",
                  metric === m.value ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {/* Chart type */}
          <div className="flex rounded-lg bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setMode("bars")}
              aria-label="Barres"
              className={cn("rounded-md p-1.5 transition", mode === "bars" ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              <BarChart3 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setMode("line")}
              aria-label="Courbe"
              className={cn("rounded-md p-1.5 transition", mode === "line" ? "bg-background shadow-sm" : "text-muted-foreground")}
            >
              <LineChart className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {points.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucune donnée sur cette période.</p>
      ) : (
        <div className="flex gap-3">
          {/* Y axis */}
          <div className="flex h-56 flex-col justify-between py-[2px] text-[10px] tabular-nums text-muted-foreground">
            {ticks.map((t, i) => (
              <span key={i}>{t === null ? "" : short(t, metric)}</span>
            ))}
          </div>

          <div className="min-w-0 flex-1">
            <div className="relative h-56" onMouseLeave={() => setHover(null)}>
              {/* Gridlines */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
                {ticks.map((_, i) => (
                  <span key={i} className="block border-t border-foreground/8" />
                ))}
              </div>

              {mode === "line" ? (
                <>
                  <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="revfill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3F8F2B" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#3F8F2B" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d={areaPath} fill="url(#revfill)" />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#3F8F2B"
                      strokeWidth="2"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                  {/* Hover targets + points */}
                  <div className="absolute inset-0 flex">
                    {points.map((p, i) => (
                      <div
                        key={p.key}
                        className="relative flex-1"
                        onMouseEnter={() => setHover(i)}
                      >
                        <span
                          className={cn(
                            "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-[#3F8F2B] transition-opacity",
                            hover === i ? "opacity-100" : "opacity-0",
                          )}
                          style={{ left: `${x(i)}%`, top: `${y(values[i])}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-end gap-[2px]">
                  {points.map((p, i) => (
                    <div
                      key={p.key}
                      className="flex h-full flex-1 items-end"
                      onMouseEnter={() => setHover(i)}
                    >
                      <div
                        className={cn(
                          "w-full rounded-t transition-colors",
                          hover === i ? "bg-[#3F8F2B]" : "bg-[#3F8F2B]/70",
                        )}
                        style={{ height: `${values[i] === 0 ? 0 : Math.max(2, (values[i] / max) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Tooltip */}
              {hover !== null && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-md"
                  style={{
                    left: `${Math.min(88, Math.max(12, x(hover)))}%`,
                    top: 4,
                  }}
                >
                  <p className="font-semibold">{points[hover].full}</p>
                  <p className="text-muted-foreground">
                    {fmt(values[hover], metric)}
                    {metric !== "orders" && ` · ${points[hover].orders} cmd`}
                  </p>
                </div>
              )}
            </div>

            {/* X axis */}
            <div className="mt-2 flex gap-[2px]">
              {points.map((p, i) => (
                <span
                  key={p.key}
                  className="flex-1 truncate text-center text-[9px] text-muted-foreground"
                >
                  {i % step === 0 ? p.label : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
