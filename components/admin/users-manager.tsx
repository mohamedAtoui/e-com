"use client";

import { UserPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { assignUserRole, createUser } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoleRow } from "@/types/database.types";

type UserRow = { id: string; email: string | null; full_name: string | null; role_id: string | null };

const selectCls =
  "h-9 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring";

export function UsersManager({ users, roles }: { users: UserRow[]; roles: RoleRow[] }) {
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role_id: roles[0]?.id ?? "" });

  function assign(userId: string, roleId: string) {
    start(async () => {
      const res = await assignUserRole(userId, roleId);
      toast[res.ok ? "success" : "error"](res.ok ? "Rôle mis à jour" : res.error ?? "Erreur");
    });
  }
  function create() {
    if (!form.email || !form.password) return toast.error("Email et mot de passe requis");
    start(async () => {
      const res = await createUser(form);
      if (res.ok) {
        toast.success("Utilisateur créé");
        setForm({ email: "", password: "", full_name: "", role_id: roles[0]?.id ?? "" });
        setOpen(false);
      } else toast.error(res.error ?? "Erreur");
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Utilisateurs</h2>
        <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
          <UserPlus className="size-4" /> Créer un utilisateur
        </Button>
      </div>

      {open && (
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Mot de passe</Label>
            <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Nom</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rôle</Label>
            <select className={`${selectCls} w-full`} value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button size="sm" onClick={create} disabled={pending}>Créer</Button>
          </div>
        </div>
      )}

      <div className="divide-y rounded-lg border">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <div className="font-medium">{u.full_name || u.email}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
            <select
              className={selectCls}
              value={u.role_id ?? ""}
              onChange={(e) => assign(u.id, e.target.value)}
              disabled={pending}
            >
              <option value="" disabled>Rôle…</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
