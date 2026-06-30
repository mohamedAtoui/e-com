"use server";

import { getCommunes, type Commune } from "@/lib/algeria-data";

/**
 * Returns the communes for one wilaya. The full 1541-commune dataset lives in
 * lib/algeria-data (imported here, server-side only) so it never ships in the
 * client bundle — the checkout form fetches just the selected wilaya's list.
 */
export async function communesForWilaya(code: number): Promise<Commune[]> {
  if (!code) return [];
  return getCommunes(code);
}
