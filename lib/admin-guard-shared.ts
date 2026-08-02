/**
 * Page-permission helpers shared by server guards and client navigation.
 * Kept out of lib/admin-guard.ts because that module is `server-only`.
 */

export const ROUTE_PAGES = ["dashboard", "orders", "products", "leads", "settings"];

/**
 * Pages that an existing role implicitly unlocks. Roles created before a page
 * existed would otherwise lose access to it: the dashboard only aggregates
 * order data, so whoever may read orders may read the dashboard.
 */
const IMPLIED_BY: Record<string, string[]> = { dashboard: ["orders"] };

export function allows(pages: string[], page: string): boolean {
  if (pages.includes(page)) return true;
  return (IMPLIED_BY[page] ?? []).some((p) => pages.includes(p));
}
