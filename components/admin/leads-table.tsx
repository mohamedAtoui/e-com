"use client";

import { Check, MessageCircle, Phone, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { updateLeadStatus } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type LeadView = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  product_name: string | null;
  locality: string;
  quantity: number | null;
  updated_at: string;
};

/** Deterministic UTC "DD/MM HH:mm" — avoids server/client hydration mismatch. */
function fmtTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

/** DZ 0X… → wa.me/213X… */
function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? "213" + digits.slice(1) : digits;
  return `https://wa.me/${intl}`;
}

export function LeadsTable({ leads }: { leads: LeadView[] }) {
  const [pending, setPending] = useState<string | null>(null);

  async function act(id: string, status: "converted" | "dismissed") {
    setPending(id);
    const res = await updateLeadStatus(id, status);
    setPending(null);
    if (res.ok) toast.success(status === "converted" ? "Marqué comme converti" : "Panier ignoré");
    else toast.error(res.error ?? "Erreur");
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Produit</TableHead>
            <TableHead>Localité</TableHead>
            <TableHead className="text-right">Qté</TableHead>
            <TableHead>Vu</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l) => {
            const phone = l.customer_phone ?? "";
            return (
              <TableRow key={l.id}>
                <TableCell className="font-medium">{l.customer_name || "—"}</TableCell>
                <TableCell>
                  {phone ? (
                    <span className="inline-flex items-center gap-2">
                      <a href={`tel:${phone}`} className="hover:underline">{phone}</a>
                      <a
                        href={waLink(phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#25D366]"
                        title="WhatsApp"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-sm">{l.product_name ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.locality}</TableCell>
                <TableCell className="text-right">{l.quantity ?? "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmtTime(l.updated_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1.5">
                    {phone && (
                      <a href={`tel:${phone}`} title="Appeler">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Phone className="size-3.5" /> Appeler
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending === l.id}
                      onClick={() => act(l.id, "converted")}
                      title="Marquer comme converti"
                    >
                      <Check className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending === l.id}
                      onClick={() => act(l.id, "dismissed")}
                      title="Ignorer"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
