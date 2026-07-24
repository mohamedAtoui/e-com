import type { OrderStatusRow } from "@/types/database.types";

/** The 6 built-in status keys, in workflow order. */
export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

/** Fallback labels/colors for the built-ins (the DB order_statuses table is the
 *  source of truth; these cover the case where it hasn't loaded). */
export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

export const STATUS_LABELS_AR: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكدة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغاة",
  returned: "مرتجعة",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "#b98900",
  confirmed: "#2f7d32",
  shipped: "#1f6feb",
  delivered: "#15803d",
  cancelled: "#b4513f",
  returned: "#9a3412",
};

export function statusLabel(status: string, statuses?: OrderStatusRow[]): string {
  return statuses?.find((s) => s.key === status)?.label_fr ?? STATUS_LABELS[status] ?? status;
}

export function statusColor(status: string, statuses?: OrderStatusRow[]): string {
  return statuses?.find((s) => s.key === status)?.color ?? STATUS_COLORS[status] ?? "#8a8a8a";
}
