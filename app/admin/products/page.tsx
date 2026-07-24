import { Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { DeleteProductButton } from "@/components/admin/delete-product-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { guardPage } from "@/lib/admin-guard";
import { productImageUrl } from "@/lib/images";
import { formatDZD } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await guardPage("products");
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produits</h1>
        <Button render={<Link href="/admin/products/new" />} nativeButton={false}>
          <Plus className="size-4" /> Nouveau produit
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">
          Aucun produit. Créez votre premier produit.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14"></TableHead>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Dispo.</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const available = p.stock_quantity - p.reserved_quantity;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="relative h-10 w-10 overflow-hidden rounded bg-muted">
                        {p.images?.[0] && (
                          <Image
                            src={productImageUrl(p.images[0])}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{p.name_fr}</div>
                      <div className="font-arabic text-xs text-muted-foreground" dir="rtl">
                        {p.name_ar}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatDZD(p.price)}</TableCell>
                    <TableCell className="text-right">
                      <span className={available <= 0 ? "text-destructive" : ""}>
                        {available}
                      </span>
                      {p.reserved_quantity > 0 && (
                        <span className="block text-xs text-muted-foreground">
                          {p.reserved_quantity} réservé(s)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge variant="secondary">Actif</Badge>
                      ) : (
                        <Badge variant="outline">Inactif</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          render={<Link href={`/admin/products/${p.id}/edit`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="icon"
                          aria-label="Modifier"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <DeleteProductButton id={p.id} name={p.name_fr} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
