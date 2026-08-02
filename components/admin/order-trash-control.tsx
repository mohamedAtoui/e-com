"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { purgeOrder, restoreOrder, trashOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";

/**
 * Trash / restore / permanent delete.
 *
 * Trashing is reversible and releases the stock the order was holding, so it is
 * a plain one-click action. Purging is not reversible and is only offered from
 * the trash, behind a confirm.
 */
export function OrderTrashControl({
  orderId,
  trashed,
  size = "sm",
  /** Detail page: after trashing there is nothing left to show. */
  redirectOnTrash,
}: {
  orderId: string;
  trashed: boolean;
  size?: "sm" | "default";
  redirectOnTrash?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(
    fn: (id: string) => Promise<{ ok: boolean; error?: string }>,
    success: string,
    then?: () => void,
  ) {
    start(async () => {
      const res = await fn(orderId);
      if (res.ok) {
        toast.success(success);
        if (then) then();
        else router.refresh();
      } else {
        toast.error(res.error ?? "Échec de l'opération");
      }
    });
  }

  if (trashed) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          size={size}
          variant="outline"
          disabled={pending}
          onClick={() => run(restoreOrder, "Commande restaurée")}
        >
          <RotateCcw className="size-4" /> Restaurer
        </Button>
        <Button
          size={size}
          variant="ghost"
          disabled={pending}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => {
            if (!confirm("Supprimer définitivement cette commande ? Cette action est irréversible.")) return;
            run(purgeOrder, "Commande supprimée définitivement", () =>
              router.push("/admin/orders?view=trash"),
            );
          }}
        >
          <Trash2 className="size-4" /> Supprimer définitivement
        </Button>
      </div>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      disabled={pending}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={() =>
        run(trashOrder, "Commande déplacée vers la corbeille", () => {
          if (redirectOnTrash) router.push("/admin/orders");
          else router.refresh();
        })
      }
    >
      <Trash2 className="size-4" /> Corbeille
    </Button>
  );
}
