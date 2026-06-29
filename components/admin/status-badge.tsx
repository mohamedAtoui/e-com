import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANT, STATUS_LABELS } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types/database.types";

export function StatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  return (
    <Badge
      variant={STATUS_BADGE_VARIANT[status]}
      className={cn(
        status === "delivered" && "bg-primary text-primary-foreground",
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
