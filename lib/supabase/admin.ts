import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Service-role Supabase client. Bypasses RLS — use ONLY in trusted server code
 * (Server Actions / Route Handlers), never import from a Client Component.
 * Used for the public order-creation path which calls the create_order RPC.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
