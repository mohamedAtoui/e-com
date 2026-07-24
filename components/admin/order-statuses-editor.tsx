"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteOrderStatus, saveOrderStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderStatusRow, StockEffect } from "@/types/database.types";

const EFFECTS: { value: StockEffect; label: string }[] = [
  { value: "reserved", label: "Réserve le stock" },
  { value: "sold", label: "Décompte le stock" },
  { value: "none", label: "Aucun effet" },
];

const selectCls =
  "h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

type Draft = {
  key?: string;
  label_fr: string;
  label_ar: string;
  stock_effect: StockEffect;
  color: string;
  sort_order: number;
  is_system: boolean;
};

function Row({ initial }: { initial: Draft }) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await saveOrderStatus(d);
      toast[res.ok ? "success" : "error"](res.ok ? "Statut enregistré" : res.error ?? "Erreur");
    });
  }
  function remove() {
    if (!d.key) return;
    start(async () => {
      const res = await deleteOrderStatus(d.key!);
      toast[res.ok ? "success" : "error"](res.ok ? "Statut supprimé" : res.error ?? "Erreur");
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
      <input type="color" value={d.color} onChange={(e) => setD({ ...d, color: e.target.value })} className="h-9 w-9 rounded" />
      <div className="space-y-1">
        <Label className="text-xs">Nom (FR)</Label>
        <Input className="h-9 w-40" value={d.label_fr} onChange={(e) => setD({ ...d, label_fr: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Nom (AR)</Label>
        <Input className="h-9 w-36 font-arabic" dir="rtl" value={d.label_ar} onChange={(e) => setD({ ...d, label_ar: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Effet stock</Label>
        <select className={selectCls} value={d.stock_effect} onChange={(e) => setD({ ...d, stock_effect: e.target.value as StockEffect })}>
          {EFFECTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Ordre</Label>
        <Input type="number" className="h-9 w-16" value={d.sort_order} onChange={(e) => setD({ ...d, sort_order: Number(e.target.value) })} />
      </div>
      <Button size="sm" onClick={save} disabled={pending}>Enregistrer</Button>
      {!d.is_system && (
        <Button size="sm" variant="outline" onClick={remove} disabled={pending} aria-label="Supprimer">
          <Trash2 className="size-4" />
        </Button>
      )}
      {d.is_system && <span className="pb-2 text-xs text-muted-foreground">système</span>}
    </div>
  );
}

export function OrderStatusesEditor({ statuses }: { statuses: OrderStatusRow[] }) {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Statuts de commande</h2>
          <p className="text-sm text-muted-foreground">
            « Réserve » retient le stock, « Décompte » le retire, « Aucun » le laisse intact.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowNew((v) => !v)}>
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>
      <div className="space-y-2">
        {statuses.map((s) => (
          <Row key={s.key} initial={{ ...s }} />
        ))}
        {showNew && (
          <Row initial={{ label_fr: "", label_ar: "", stock_effect: "none", color: "#8a8a8a", sort_order: 100, is_system: false }} />
        )}
      </div>
    </div>
  );
}
