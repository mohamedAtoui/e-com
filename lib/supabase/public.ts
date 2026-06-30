import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Cookieless anonymous Supabase client for PUBLIC read-only storefront data.
 * Because it does not touch cookies(), pages using it can be statically
 * rendered / ISR-cached (unlike lib/supabase/server.ts which forces dynamic).
 * Never use for authenticated or per-user data.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
}
