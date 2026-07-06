import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Cookieless anonymous Supabase client for PUBLIC read-only storefront data.
 * Because it does not touch cookies(), pages using it can be statically
 * rendered / ISR-cached (unlike lib/supabase/server.ts which forces dynamic).
 * Never use for authenticated or per-user data.
 *
 * Resilient by design: if the public env vars are missing at build time we fall
 * back to a placeholder so construction never throws (which would crash static
 * prerendering of `/` and `/collection` and fail the whole Vercel build).
 * Callers already treat a failed query as empty data, so the page renders empty
 * instead of the deploy dying. When the real env vars are present, nothing
 * changes.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn(
      "[supabase] NEXT_PUBLIC_SUPABASE_URL/ANON_KEY missing — storefront data will be empty. Set them in your Vercel env.",
    );
  }
  return createSupabaseClient<Database>(
    url || "https://placeholder.supabase.co",
    key || "placeholder-anon-key",
    { auth: { persistSession: false } },
  );
}
