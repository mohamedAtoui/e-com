"use client";

import { RotateCcw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

const RANGES: FilterOption[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
  { value: "all", label: "Tout" },
];

const selectCls =
  "h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

export function DashboardFilters({
  products,
  wilayas,
  statuses,
}: {
  products: FilterOption[];
  wilayas: FilterOption[];
  statuses: FilterOption[];
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const range = sp.get("range") ?? "30d";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const product = sp.get("product") ?? "";
  const wilaya = sp.get("wilaya") ?? "";
  const status = sp.get("status") ?? "";

  function apply(patch: Record<string, string | null>) {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    start(() => router.push(`/admin?${next.toString()}`, { scroll: false }));
  }

  const custom = Boolean(from || to);

  return (
    <div className={cn("space-y-3 rounded-xl border p-4", pending && "opacity-60")}>
      {/* Quick ranges */}
      <div className="flex flex-wrap items-center gap-2">
        {RANGES.map((r) => (
          <button
            key={r.value}
            type="button"
            onClick={() => apply({ range: r.value, from: null, to: null })}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
              !custom && range === r.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Precise filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Du
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(e) => apply({ from: e.target.value, range: null })}
            className={selectCls}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Au
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(e) => apply({ to: e.target.value, range: null })}
            className={selectCls}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Produit
          <select
            value={product}
            onChange={(e) => apply({ product: e.target.value })}
            className={cn(selectCls, "max-w-[220px]")}
          >
            <option value="">Tous les produits</option>
            {products.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Wilaya
          <select
            value={wilaya}
            onChange={(e) => apply({ wilaya: e.target.value })}
            className={cn(selectCls, "max-w-[180px]")}
          >
            <option value="">Toutes</option>
            {wilayas.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          Statut
          <select
            value={status}
            onChange={(e) => apply({ status: e.target.value })}
            className={cn(selectCls, "max-w-[160px]")}
          >
            <option value="">Tous</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => start(() => router.push("/admin", { scroll: false }))}
        >
          <RotateCcw className="size-4" /> Réinitialiser
        </Button>
      </div>
    </div>
  );
}
