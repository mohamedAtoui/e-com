import Link from "next/link";

import { MetaPixel } from "@/components/storefront/meta-pixel";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const storeName = "Ma Boutique";
  return (
    <>
      <MetaPixel pixelId={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            {storeName}
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Nos produits
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">{storeName}</p>
          <p className="mt-1">
            Paiement à la livraison — Livraison partout en Algérie · الدفع عند الاستلام
          </p>
          <p className="mt-4 text-xs">
            © {new Date().getFullYear()} {storeName}. Tous droits réservés.
          </p>
        </div>
      </footer>
    </>
  );
}
