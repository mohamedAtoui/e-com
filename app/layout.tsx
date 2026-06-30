import type { Metadata } from "next";
import {
  Fraunces,
  Hanken_Grotesk,
  El_Messiri,
  Tajawal,
  Geist_Mono,
} from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";

const hanken = Hanken_Grotesk({ variable: "--font-sans", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-serif", subsets: ["latin"], style: ["normal", "italic"] });
const elMessiri = El_Messiri({ variable: "--font-arabic-heading", subsets: ["arabic"], weight: ["500", "600", "700"] });
const tajawal = Tajawal({ variable: "--font-arabic", subsets: ["arabic"], weight: ["400", "500", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: "Lighty — Luminaires faits main",
  description:
    "Lighty · Atelier d'Alger. Luminaires et objets façonnés à la main. Paiement à la livraison, partout en Algérie.",
};

// Runs before first paint: applies the saved Arabic/RTL preference on the
// storefront so there's no FR→AR flash, while keeping pages statically rendered.
const NO_FLASH_LANG = `(function(){try{if(location.pathname.indexOf('/admin')===0)return;if(localStorage.getItem('lighty-lang')==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${hanken.variable} ${fraunces.variable} ${elMessiri.variable} ${tajawal.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_LANG }} />
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
