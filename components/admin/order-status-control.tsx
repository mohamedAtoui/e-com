"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatus } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { statusLabel } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatusRow } from "@/types/database.types";

export function OrderStatusControl({
  orderId,
  status,
  statuses,
}: {
  orderId: string;
  status: string;
  statuses: OrderStatusRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(to: string) {
    if (to === status) return;
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, to);
      if (res.ok) {
        toast.success(`Commande → ${statusLabel(to, statuses)}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de la mise à jour");
      }
    });
  }

  const hasConfirm = statuses.some((s) => s.key === "confirmed");
  const hasCancel = statuses.some((s) => s.key === "cancelled");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {hasConfirm && status !== "confirmed" && (
        <Button size="sm" disabled={pending} onClick={() => move("confirmed")}>
          Confirmer
        </Button>
      )}
      {hasCancel && status !== "cancelled" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => move("cancelled")}>
          Annuler
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="sm" variant="outline" disabled={pending}>
              Statut <ChevronDown className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {statuses.map((s) => (
            <DropdownMenuItem key={s.key} onClick={() => move(s.key)}>
              <Check className={cn("size-3.5", s.key === status ? "opacity-100" : "opacity-0")} />
              {s.label_fr}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
