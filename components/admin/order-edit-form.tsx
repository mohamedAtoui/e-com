"use client";

import { Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { communesForWilaya } from "@/actions/geo";
import { updateOrderDetails } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Commune } from "@/lib/algeria-data";
import { WILAYAS } from "@/lib/wilayas";
import { cn } from "@/lib/utils";

const selectCls =
  "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring disabled:opacity-50";

export interface OrderEditable {
  id: string;
  customer_name: string;
  customer_phone: string;
  wilaya_code: number;
  commune_id: number;
  address: string | null;
  delivery_method: string;
  notes: string | null;
}

export function OrderEditForm({
  order,
  quantity,
  /** Quantity is only editable when the order has a single line. */
  singleItem,
}: {
  order: OrderEditable;
  quantity: number;
  singleItem: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const [name, setName] = useState(order.customer_name);
  const [phone, setPhone] = useState(order.customer_phone);
  const [wilaya, setWilaya] = useState(String(order.wilaya_code));
  const [commune, setCommune] = useState(String(order.commune_id));
  const [address, setAddress] = useState(order.address ?? "");
  const [method, setMethod] = useState(order.delivery_method);
  const [notes, setNotes] = useState(order.notes ?? "");
  const [qty, setQty] = useState(String(quantity));

  const [communes, setCommunes] = useState<Commune[]>([]);
  const wilayaCode = Number(wilaya) || 0;

  useEffect(() => {
    if (!open || !wilayaCode) return;
    let active = true;
    communesForWilaya(wilayaCode).then((c) => {
      if (active) setCommunes(c);
    });
    return () => {
      active = false;
    };
  }, [open, wilayaCode]);

  function reset() {
    setName(order.customer_name);
    setPhone(order.customer_phone);
    setWilaya(String(order.wilaya_code));
    setCommune(String(order.commune_id));
    setAddress(order.address ?? "");
    setMethod(order.delivery_method);
    setNotes(order.notes ?? "");
    setQty(String(quantity));
    setOpen(false);
  }

  function save() {
    if (!commune) {
      toast.error("Choisissez une commune.");
      return;
    }
    start(async () => {
      const res = await updateOrderDetails(order.id, {
        customer_name: name,
        customer_phone: phone,
        wilaya_code: Number(wilaya),
        commune_id: Number(commune),
        address: address.trim() || null,
        delivery_method: method === "stopdesk" ? "stopdesk" : "home",
        notes: notes.trim() || null,
        quantity: singleItem && Number(qty) !== quantity ? Number(qty) : null,
      });
      if (res.ok) {
        toast.success("Commande mise à jour");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de la mise à jour");
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-4" /> Modifier la commande
      </Button>
    );
  }

  return (
    <div className={cn("space-y-4 rounded-xl border p-4", pending && "opacity-60")}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Modifier la commande</h2>
        <Button variant="ghost" size="sm" onClick={reset} disabled={pending}>
          <X className="size-4" /> Annuler
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="e-name">Nom du client</Label>
          <Input id="e-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-phone">Téléphone</Label>
          <Input id="e-phone" value={phone} inputMode="tel" onChange={(e) => setPhone(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="e-wilaya">Wilaya</Label>
          <select
            id="e-wilaya"
            className={selectCls}
            value={wilaya}
            onChange={(e) => {
              setWilaya(e.target.value);
              setCommune("");
            }}
          >
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} · {w.name_fr}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-commune">Commune</Label>
          <select
            id="e-commune"
            className={selectCls}
            value={commune}
            disabled={communes.length === 0}
            onChange={(e) => setCommune(e.target.value)}
          >
            <option value="">Choisir…</option>
            {communes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_fr}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="e-method">Mode de livraison</Label>
          <select
            id="e-method"
            className={selectCls}
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="home">À domicile</option>
            <option value="stopdesk">Au bureau (Stop Desk)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="e-qty">Quantité</Label>
          <Input
            id="e-qty"
            type="number"
            min={1}
            value={qty}
            disabled={!singleItem}
            onChange={(e) => setQty(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            {singleItem
              ? "Le prix et le stock sont recalculés automatiquement."
              : "Modifiable uniquement sur une commande à un seul produit."}
          </p>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="e-address">Adresse (optionnel)</Label>
          <Input id="e-address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="e-notes">Notes internes</Label>
          <textarea
            id="e-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-lg border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Les frais de livraison et le total sont recalculés selon la wilaya et le mode choisis.
      </p>

      <div className="flex gap-2">
        <Button onClick={save} disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Enregistrer
        </Button>
        <Button variant="outline" onClick={reset} disabled={pending}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
