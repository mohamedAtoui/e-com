import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Produit introuvable</h1>
      <p className="text-muted-foreground">
        Ce produit n&apos;existe pas ou n&apos;est plus disponible.
      </p>
      <p className="font-arabic text-muted-foreground" dir="rtl" lang="ar">
        هذا المنتج غير موجود أو لم يعد متوفراً
      </p>
      <Button render={<Link href="/" />} nativeButton={false}>
        Retour à la boutique
      </Button>
    </div>
  );
}
