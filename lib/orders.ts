import type { OrderStatus } from "@/types/database.types";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  returned: "Retournée",
};

export const STATUS_LABELS_AR: Record<OrderStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكدة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "ملغاة",
  returned: "مرتجعة",
};

/** Must mirror the state machine in update_order_status() (0001_init.sql). */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled", "returned"],
  shipped: ["delivered", "cancelled", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export const STATUS_BADGE_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  confirmed: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  returned: "destructive",
};
