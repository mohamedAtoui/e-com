import { LangProvider } from "@/components/storefront/lang-provider";
import { MetaPixel } from "@/components/storefront/meta-pixel";
import { MotionProvider } from "@/components/storefront/motion-provider";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LangProvider>
      <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
      {/* Film grain overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] opacity-[0.035] mix-blend-multiply"
        style={{ backgroundImage: GRAIN }}
      />
      <SiteHeader />
      <MotionProvider>
        <main className="flex-1">{children}</main>
      </MotionProvider>
      <SiteFooter />
    </LangProvider>
  );
}
