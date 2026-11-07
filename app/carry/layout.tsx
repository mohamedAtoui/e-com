import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import { CarryHeader, CarryFooter } from "@/components/carry/shop-chrome";
import { LangProvider } from "@/components/storefront/lang-provider";
import { MetaPixel } from "@/components/storefront/meta-pixel";
import { VisitTracker } from "@/components/storefront/visit-tracker";
import { createPublicClient } from "@/lib/supabase/public";
import "./carry.css";

const carryHeading = Barlow({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  variable: "--font-carry-heading",
});
const carryBody = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-carry-body",
});

export const metadata: Metadata = {
  title: "CARRY — L’essentiel, avec vous.",
  description:
    "Découvrez notre collection de sacs. Commandez en dinars algériens, payez à la livraison. Livraison dans 58 wilayas.",
};

export default async function CarryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = await createPublicClient().rpc("get_storefront_settings");
  const pixelId =
    (data as { meta_pixel_id?: string } | null)?.meta_pixel_id ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID;
  return (
    <LangProvider>
      <div
        className={`carry-shop ${carryHeading.variable} ${carryBody.variable}`}
      >
        <MetaPixel pixelId={pixelId} />
        <CarryHeader />
        <main id="carry-main">{children}</main>
        <CarryFooter />
        <VisitTracker />
      </div>
    </LangProvider>
  );
}
