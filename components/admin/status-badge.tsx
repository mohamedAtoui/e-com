import { statusColor, statusLabel } from "@/lib/orders";
import { cn } from "@/lib/utils";
import type { OrderStatusRow } from "@/types/database.types";

export function StatusBadge({
  status,
  statuses,
  className,
}: {
  status: string;
  statuses?: OrderStatusRow[];
  className?: string;
}) {
  const color = statusColor(status, statuses);
  const label = statusLabel(status, statuses);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        className,
      )}
      style={{ background: `${color}1a`, color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
