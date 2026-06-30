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
  title: "Lighty — Luminaires faits main",
  description:
    "Lighty · Atelier d'Alger. Luminaires et objets façonnés à la main. Paiement à la livraison, partout en Algérie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${hanken.variable} ${fraunces.variable} ${elMessiri.variable} ${tajawal.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
