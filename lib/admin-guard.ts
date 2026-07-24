import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const ROUTE_PAGES = ["orders", "products", "leads", "settings"];

/**
 * Current admin's allowed page keys, or `null` when RBAC isn't active yet
 * (the my_pages RPC / 0009 migration isn't applied). `null` = no restriction,
 * so deploying this code before running 0009 never locks anyone out.
 */
export async function myPages(): Promise<string[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_pages");
  if (error) return null;
  return (data as string[] | null) ?? [];
}

/** Redirect away if the admin lacks access to `page` (no-op when unrestricted). */
export async function guardPage(page: string): Promise<void> {
  const allowed = await myPages();
  if (allowed === null) return;
  if (!allowed.includes(page)) {
    const dest = ROUTE_PAGES.find((p) => allowed.includes(p));
    redirect(dest ? `/admin/${dest}` : "/");
  }
}
