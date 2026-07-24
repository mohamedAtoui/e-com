"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteRole, saveRole } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleRow } from "@/types/database.types";

export const ALL_PAGES: { key: string; label: string }[] = [
  { key: "orders", label: "Commandes" },
  { key: "leads", label: "Paniers abandonnés" },
  { key: "products", label: "Produits" },
  { key: "settings", label: "Paramètres" },
  { key: "statuses", label: "Gérer les statuts" },
  { key: "roles", label: "Gérer les rôles" },
  { key: "users", label: "Gérer les utilisateurs" },
];

type Draft = { id?: string; name: string; pages: string[]; is_system: boolean };

function RoleCard({ initial }: { initial: Draft }) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, start] = useTransition();

  function toggle(page: string) {
    setD((cur) => ({
      ...cur,
      pages: cur.pages.includes(page) ? cur.pages.filter((p) => p !== page) : [...cur.pages, page],
    }));
  }
  function save() {
    if (!d.name.trim()) return toast.error("Nom du rôle requis");
    start(async () => {
      const res = await saveRole({ id: d.id, name: d.name.trim(), pages: d.pages });
      toast[res.ok ? "success" : "error"](res.ok ? "Rôle enregistré" : res.error ?? "Erreur");
    });
  }
  function remove() {
    if (!d.id) return;
    start(async () => {
      const res = await deleteRole(d.id!);
      toast[res.ok ? "success" : "error"](res.ok ? "Rôle supprimé" : res.error ?? "Erreur");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Input
          className="h-9 max-w-xs font-medium"
          value={d.name}
          placeholder="Nom du rôle"
          disabled={d.is_system}
          onChange={(e) => setD({ ...d, name: e.target.value })}
        />
        {d.is_system && <span className="text-xs text-muted-foreground">système</span>}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {ALL_PAGES.map((p) => (
          <label key={p.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={d.pages.includes(p.key)} disabled={d.is_system} onChange={() => toggle(p.key)} />
            {p.label}
          </label>
        ))}
      </div>
      {!d.is_system && (
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={pending}>Enregistrer</Button>
          <Button size="sm" variant="outline" onClick={remove} disabled={pending}>
            <Trash2 className="size-4" /> Supprimer
          </Button>
        </div>
      )}
    </div>
  );
}

export function RolesEditor({ roles }: { roles: RoleRow[] }) {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Rôles &amp; permissions</h2>
          <p className="text-sm text-muted-foreground">Cochez les pages que chaque rôle peut voir.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowNew((v) => !v)}>
          <Plus className="size-4" /> Nouveau rôle
        </Button>
      </div>
      <div className="space-y-2">
        {roles.map((r) => (
          <RoleCard key={r.id} initial={{ ...r }} />
        ))}
        {showNew && <RoleCard initial={{ name: "", pages: ["orders"], is_system: false }} />}
      </div>
    </div>
  );
}
