"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { updateOrderStatus } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { ALLOWED_TRANSITIONS, STATUS_LABELS } from "@/lib/orders";
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
  const next = ALLOWED_TRANSITIONS[status];

  if (next.length === 0) {
    return <span className="text-xs text-muted-foreground">Aucune action</span>;
  }

  function move(to: OrderStatus) {
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
    <div className="flex flex-wrap gap-1.5">
      {next.map((to) => (
        <Button
          key={to}
          size="sm"
          variant={to === "cancelled" || to === "returned" ? "outline" : "default"}
          disabled={pending}
          onClick={() => move(to)}
        >
          {STATUS_LABELS[to]}
        </Button>
      ))}
    </div>
  );
}
