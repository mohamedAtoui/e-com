"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsRow } from "@/types/database.types";

export function SettingsForm({ settings }: { settings: SettingsRow | null }) {
  const [storeName, setStoreName] = useState(settings?.store_name ?? "");
  const [pixelId, setPixelId] = useState(settings?.meta_pixel_id ?? "");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateSettings({ store_name: storeName, meta_pixel_id: pixelId });
    setSaving(false);
    if (res.ok) toast.success("Paramètres enregistrés");
    else toast.error(res.error ?? "Erreur");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-xl border p-5">
      <h2 className="font-semibold">Général</h2>
      <div className="space-y-1.5">
        <Label htmlFor="store_name">Nom de la boutique</Label>
        <Input
          id="store_name"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="meta_pixel_id">Meta Pixel ID</Label>
        <Input
          id="meta_pixel_id"
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          placeholder="123456789012345"
        />
        <p className="text-xs text-muted-foreground">
          Le pixel s'active automatiquement sur la boutique dès qu'un ID est enregistré ici.
        </p>
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
