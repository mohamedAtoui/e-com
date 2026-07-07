/**
 * Hand-written Supabase schema types matching supabase/migrations/0001_init.sql.
 * Regenerate with `supabase gen types typescript` once the CLI is linked to the
 * project to keep this in perfect sync.
 *
 * IMPORTANT: every Row / Args shape is a `type` alias (NOT an interface).
 * Interfaces have no implicit index signature, so they are not assignable to
 * GenericTable.Row / GenericFunction.Args (= Record<string, unknown>), which
 * makes the whole Postgrest schema resolve to `never`.
 */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";

export type DeliveryMethod = "home" | "stopdesk";
export type ProductCategory =
  | "lampe"
  | "suspension"
  | "applique"
  | "lanterne"
  | "autre";
export type StockMovementType =
  | "reserve"
  | "release"
  | "decrement"
  | "restock"
  | "manual";

type Timestamps = { created_at: string; updated_at: string };

export type ContentBlock =
  | { type: "heading"; fr: string; ar: string }
  | { type: "paragraph"; fr: string; ar: string }
  | { type: "image"; src: string; alt: string };

export type ProductRow = Timestamps & {
  id: string;
  slug: string;
  name_fr: string;
  name_ar: string;
  description_fr: string | null;
  description_ar: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number;
  reserved_quantity: number;
  is_active: boolean;
  category: ProductCategory;
  images: string[];
  offers: { qty: number; price: number }[];
  description_blocks: ContentBlock[];
};

export type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  wilaya_code: number;
  commune_id: number;
  address: string | null;
  delivery_method: DeliveryMethod;
  delivery_fee: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  notes: string | null;
  meta_event_id: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name_fr: string | null;
  product_name_ar: string | null;
};

export type WilayaRow = {
  code: number;
  name_fr: string;
  name_ar: string;
  ascii_name: string | null;
};

export type CommuneRow = {
  id: number;
  wilaya_code: number;
  name_fr: string;
  name_ar: string;
  post_code: string | null;
};

export type DeliveryFeeRow = {
  wilaya_code: number;
  home_fee: number;
  stopdesk_fee: number;
  home_available: boolean;
  stopdesk_available: boolean;
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "commercial";
  created_at: string;
};

export type SettingsRow = {
  id: boolean;
  store_name: string;
  meta_pixel_id: string | null;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  free_shipping_threshold: number | null;
  updated_at: string;
};

export type LeadStatus = "active" | "converted" | "dismissed";

export type CheckoutLeadRow = {
  id: string;
  product_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  wilaya_code: number | null;
  commune_id: number | null;
  delivery_method: string | null;
  quantity: number | null;
  status: LeadStatus;
  order_id: string | null;
  created_at: string;
  updated_at: string;
};

export type StockMovementRow = {
  id: string;
  product_id: string;
  order_id: string | null;
  delta: number;
  type: StockMovementType;
  created_by: string | null;
  created_at: string;
};

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type CreateOrderArgs = {
  p_customer_name: string;
  p_customer_phone: string;
  p_wilaya_code: number;
  p_commune_id: number;
  p_address: string | null;
  p_delivery_method: DeliveryMethod;
  p_items: { product_id: string; quantity: number }[];
};

export type CreateOrderResult = {
  order_id: string;
  order_number: number;
  subtotal: number;
  delivery_fee: number;
  total: number;
  meta_event_id: string;
};

export type OrderSummary = {
  order_number: number;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_method: DeliveryMethod;
  wilaya_code: number;
  commune_id: number;
  created_at: string;
  items: { name_fr: string | null; name_ar: string | null; quantity: number; unit_price: number }[];
} | null;

export type Database = {
  public: {
    Tables: {
      products: Table<ProductRow>;
      orders: Table<OrderRow>;
      order_items: Table<OrderItemRow>;
      wilayas: Table<WilayaRow>;
      communes: Table<CommuneRow>;
      delivery_fees: Table<DeliveryFeeRow>;
      profiles: Table<ProfileRow>;
      settings: Table<SettingsRow>;
      stock_movements: Table<StockMovementRow>;
      checkout_leads: Table<CheckoutLeadRow>;
    };
    Views: Record<string, never>;
    Functions: {
      create_order: {
        Args: CreateOrderArgs;
        Returns: CreateOrderResult;
      };
      update_order_status: {
        Args: { p_order_id: string; p_status: OrderStatus };
        Returns: undefined;
      };
      is_admin: { Args: Record<string, never>; Returns: boolean };
      get_order_summary: { Args: { p_event_id: string }; Returns: OrderSummary };
      get_storefront_settings: {
        Args: Record<string, never>;
        Returns: { store_name: string; meta_pixel_id: string | null };
      };
    };
  };
};
