import Image from "next/image";
import Link from "next/link";

import { BilingualText } from "@/components/storefront/bilingual-text";
import { Badge } from "@/components/ui/badge";
import { formatDZD } from "@/lib/money";
import { productImageUrl } from "@/lib/images";
import type { ProductRow } from "@/types/database.types";

type CardProduct = Pick<
  ProductRow,
  | "slug"
  | "name_fr"
  | "name_ar"
  | "price"
  | "compare_at_price"
  | "images"
  | "stock_quantity"
  | "reserved_quantity"
>;

export function ProductCard({ product }: { product: CardProduct }) {
  const cover = product.images?.[0];
  const available = product.stock_quantity - product.reserved_quantity;
  const onSale =
    product.compare_at_price != null && product.compare_at_price > product.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={productImageUrl(cover)}
            alt={product.name_fr}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Pas d&apos;image
          </div>
        )}
        {onSale ? (
          <Badge className="absolute left-2 top-2" variant="destructive">
            Promo
          </Badge>
        ) : null}
        {available <= 0 ? (
          <Badge className="absolute right-2 top-2" variant="secondary">
            Rupture
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <BilingualText
          fr={product.name_fr}
          ar={product.name_ar}
          as="h3"
          className="font-medium leading-tight"
          arClassName="text-sm"
        />
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold text-primary">
            {formatDZD(product.price)}
          </span>
          {onSale ? (
            <span className="text-sm text-muted-foreground line-through">
              {formatDZD(product.compare_at_price!)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
