import { LangProvider } from "@/components/storefront/lang-provider";
import { MetaPixel } from "@/components/storefront/meta-pixel";
import { MotionProvider } from "@/components/storefront/motion-provider";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { createPublicClient } from "@/lib/supabase/public";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/** Pixel id: admin Settings (DB) is the source of truth, env is the fallback.
 *  Reading via the public RPC is what makes the configured Pixel actually load. */
async function getPixelId(): Promise<string | undefined> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.rpc("get_storefront_settings");
    const dbId = (data as { meta_pixel_id: string | null } | null)?.meta_pixel_id;
    if (dbId) return dbId;
  } catch {
    // settings unavailable — fall through to env
  }
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || undefined;
}

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pixelId = await getPixelId();
  return (
    <LangProvider>
      <MetaPixel pixelId={pixelId} />
      {/* Film grain overlay — no mix-blend (that forces a full-viewport
          recomposite every scroll frame = jank); plain low opacity is enough. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] opacity-[0.04]"
        style={{ backgroundImage: GRAIN }}
      />
      <SiteHeader />
      <MotionProvider>
        <main className="flex-1 overflow-x-hidden">{children}</main>
      </MotionProvider>
      <SiteFooter />
      <VisitTracker />
    </LangProvider>
  );
}
