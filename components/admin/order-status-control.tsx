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
import { ORDER_STATUSES, STATUS_LABELS } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database.types";

export function OrderStatusControl({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(to: OrderStatus) {
    if (to === status) return;
    startTransition(async () => {
      const res = await updateOrderStatus(orderId, to);
      if (res.ok) {
        toast.success(`Commande → ${STATUS_LABELS[to]}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Échec de la mise à jour");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Quick COD actions */}
      {status !== "confirmed" && (
        <Button size="sm" disabled={pending} onClick={() => move("confirmed")}>
          Confirmer
        </Button>
      )}
      {status !== "cancelled" && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => move("cancelled")}>
          Annuler
        </Button>
      )}

      {/* Set any status */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button size="sm" variant="outline" disabled={pending}>
              Statut <ChevronDown className="size-3.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          {ORDER_STATUSES.map((s) => (
            <DropdownMenuItem key={s} onClick={() => move(s)}>
              <Check className={cn("size-3.5", s === status ? "opacity-100" : "opacity-0")} />
              {STATUS_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
