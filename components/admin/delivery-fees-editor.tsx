"use client";

import { useState } from "react";
import { toast } from "sonner";

import { updateDeliveryFee } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getWilaya } from "@/lib/algeria-data";
import type { DeliveryFeeRow } from "@/types/database.types";

export function DeliveryFeesEditor({ fees }: { fees: DeliveryFeeRow[] }) {
  const [rows, setRows] = useState<DeliveryFeeRow[]>(fees);
  const [savingCode, setSavingCode] = useState<number | null>(null);
  const [query, setQuery] = useState("");

  function patch(code: number, partial: Partial<DeliveryFeeRow>) {
    setRows((rs) => rs.map((r) => (r.wilaya_code === code ? { ...r, ...partial } : r)));
  }

  async function save(row: DeliveryFeeRow) {
    setSavingCode(row.wilaya_code);
    const res = await updateDeliveryFee(row);
    setSavingCode(null);
    if (res.ok) toast.success(`Wilaya ${row.wilaya_code} enregistrée`);
    else toast.error(res.error ?? "Erreur");
  }

  const filtered = rows.filter((r) => {
    if (!query) return true;
    const w = getWilaya(r.wilaya_code);
    const q = query.toLowerCase();
    return (
      String(r.wilaya_code).includes(q) ||
      w?.name_fr.toLowerCase().includes(q) ||
      w?.name_ar.includes(query)
    );
  });

  return (
    <div className="space-y-3 rounded-xl border p-5">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-semibold">Frais de livraison par wilaya</h2>
        <Input
          placeholder="Rechercher une wilaya…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wilaya</TableHead>
              <TableHead className="w-32">Domicile (DA)</TableHead>
              <TableHead className="w-32">Bureau (DA)</TableHead>
              <TableHead>Domicile</TableHead>
              <TableHead>Bureau</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => {
              const w = getWilaya(r.wilaya_code);
              return (
                <TableRow key={r.wilaya_code}>
                  <TableCell>
                    <span className="font-medium">
                      {r.wilaya_code} - {w?.name_fr}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={r.home_fee}
                      onChange={(e) => patch(r.wilaya_code, { home_fee: Number(e.target.value) })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      value={r.stopdesk_fee}
                      onChange={(e) =>
                        patch(r.wilaya_code, { stopdesk_fee: Number(e.target.value) })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={r.home_available}
                      onCheckedChange={(v) => patch(r.wilaya_code, { home_available: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={r.stopdesk_available}
                      onCheckedChange={(v) => patch(r.wilaya_code, { stopdesk_available: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={savingCode === r.wilaya_code}
                      onClick={() => save(r)}
                    >
                      {savingCode === r.wilaya_code ? "…" : "OK"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
