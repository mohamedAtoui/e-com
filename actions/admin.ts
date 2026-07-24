"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/validators";

export interface ActionState {
  ok: boolean;
  error?: string;
}

// ---- Order statuses -------------------------------------------------------
export async function saveOrderStatus(input: {
  key?: string;
  label_fr: string;
  label_ar: string;
  stock_effect: "reserved" | "sold" | "none";
  color: string;
  sort_order: number;
}): Promise<ActionState> {
  const supabase = await createClient();
  const key = input.key || slugify(input.label_fr) || `status-${Date.now()}`;
  const { error } = await supabase.from("order_statuses").upsert({
    key,
    label_fr: input.label_fr,
    label_ar: input.label_ar,
    stock_effect: input.stock_effect,
    color: input.color,
    sort_order: input.sort_order,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  revalidatePath("/admin/orders");
  return { ok: true };
}

export async function deleteOrderStatus(key: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("order_statuses").delete().eq("key", key).eq("is_system", false);
  if (error) {
    if (error.message.includes("foreign key") || error.message.includes("still referenced"))
      return { ok: false, error: "Des commandes utilisent ce statut." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ---- Roles ----------------------------------------------------------------
export async function saveRole(input: {
  id?: string;
  name: string;
  pages: string[];
}): Promise<ActionState> {
  const supabase = await createClient();
  const row = { name: input.name, pages: input.pages };
  const { error } = input.id
    ? await supabase.from("roles").update(row).eq("id", input.id)
    : await supabase.from("roles").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function deleteRole(id: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("roles").delete().eq("id", id).eq("is_system", false);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

// ---- Users ----------------------------------------------------------------
export async function assignUserRole(userId: string, roleId: string): Promise<ActionState> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role_id: roleId }).eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function createUser(input: {
  email: string;
  password: string;
  full_name: string;
  role_id: string;
}): Promise<ActionState> {
  // Permission check runs as the caller (RLS-aware) before using the service role.
  const authed = await createClient();
  const { data: allowed } = await authed.rpc("has_page", { p: "users" });
  if (!allowed) return { ok: false, error: "Non autorisé." };
  if (input.password.length < 6) return { ok: false, error: "Mot de passe trop court (min 6)." };

  const admin = createAdminClient();
  const { data: created, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.full_name },
  });
  if (error || !created.user) return { ok: false, error: error?.message ?? "Échec de création." };

  // No signup trigger anymore (0003) — create the admin profile explicitly.
  const { error: pErr } = await admin.from("profiles").upsert({
    id: created.user.id,
    email: input.email,
    full_name: input.full_name,
    role: "commercial",
    role_id: input.role_id,
  });
  if (pErr) return { ok: false, error: pErr.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}
