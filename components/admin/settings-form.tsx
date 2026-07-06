"use client";

import { useState } from "react";
import { toast } from "sonner";

import { sendTestTelegram, updateSettings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SettingsRow } from "@/types/database.types";

export function SettingsForm({ settings }: { settings: SettingsRow | null }) {
  const [storeName, setStoreName] = useState(settings?.store_name ?? "");
  const [pixelId, setPixelId] = useState(settings?.meta_pixel_id ?? "");
  const [tgToken, setTgToken] = useState(settings?.telegram_bot_token ?? "");
  const [tgChatId, setTgChatId] = useState(settings?.telegram_chat_id ?? "");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  function values() {
    return {
      store_name: storeName,
      meta_pixel_id: pixelId,
      telegram_bot_token: tgToken,
      telegram_chat_id: tgChatId,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateSettings(values());
    setSaving(false);
    if (res.ok) toast.success("Paramètres enregistrés");
    else toast.error(res.error ?? "Erreur");
  }

  // Save first (so we test exactly what's shown), then send a real test message.
  async function onTest() {
    setTesting(true);
    const saved = await updateSettings(values());
    if (!saved.ok) {
      setTesting(false);
      toast.error(saved.error ?? "Erreur d'enregistrement");
      return;
    }
    const res = await sendTestTelegram();
    setTesting(false);
    if (res.ok) toast.success("Message de test envoyé ✅ — vérifiez Telegram");
    else toast.error(`Échec Telegram : ${res.error ?? "inconnu"}`, { duration: 12000 });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg space-y-4 rounded-xl border p-5">
      <h2 className="font-semibold">Général</h2>
      <div className="space-y-1.5">
        <Label htmlFor="store_name">Nom de la boutique</Label>
        <Input id="store_name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
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
          Le pixel s&apos;active automatiquement sur la boutique dès qu&apos;un ID est enregistré ici.
        </p>
      </div>

      <div className="space-y-3 border-t pt-4">
        <h2 className="font-semibold">Notifications Telegram</h2>
        <p className="text-xs text-muted-foreground">
          Recevez chaque nouvelle commande sur votre téléphone. Créez un bot avec @BotFather,
          <strong> envoyez-lui un message</strong> (obligatoire), puis collez le token et votre chat id.
        </p>
        <div className="space-y-1.5">
          <Label htmlFor="tg_token">Bot token</Label>
          <Input
            id="tg_token"
            value={tgToken}
            onChange={(e) => setTgToken(e.target.value)}
            placeholder="123456:ABC-DEF..."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tg_chat">Chat ID</Label>
          <Input
            id="tg_chat"
            value={tgChatId}
            onChange={(e) => setTgChatId(e.target.value)}
            placeholder="1817372923"
          />
        </div>
        <Button type="button" variant="outline" onClick={onTest} disabled={testing}>
          {testing ? "Envoi…" : "Envoyer un message de test"}
        </Button>
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
