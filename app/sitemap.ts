import type { MetadataRoute } from "next";

import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://e-com-pearl-seven.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true);

  const products = (data ?? []).map((p) => ({
    url: `${BASE}/products/${p.slug}`,
    lastModified: p.updated_at,
  }));

  return [
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/collection`, changeFrequency: "daily", priority: 0.9 },
    ...products,
  ];
}
