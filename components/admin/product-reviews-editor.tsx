"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteReview, saveReview } from "@/actions/reviews";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { ProductReviewRow } from "@/types/database.types";

type Draft = Omit<ProductReviewRow, "created_at"> & { created_at?: string };

function emptyDraft(productId: string): Draft {
  return {
    id: "",
    product_id: productId,
    author_name: "",
    rating: 5,
    comment_fr: "",
    comment_ar: "",
    image_path: null,
    is_published: true,
    sort_order: 0,
  };
}

function ReviewCard({ initial, productId }: { initial: Draft; productId: string }) {
  const [d, setD] = useState<Draft>(initial);
  const [pending, start] = useTransition();

  function save() {
    start(async () => {
      const res = await saveReview({
        id: d.id || undefined,
        product_id: productId,
        author_name: d.author_name,
        rating: d.rating,
        comment_fr: d.comment_fr,
        comment_ar: d.comment_ar,
        image_path: d.image_path,
        is_published: d.is_published,
        sort_order: d.sort_order,
      });
      toast[res.ok ? "success" : "error"](res.ok ? "Avis enregistré" : res.error ?? "Erreur");
    });
  }

  function remove() {
    if (!d.id) return;
    start(async () => {
      const res = await deleteReview(d.id, productId);
      toast[res.ok ? "success" : "error"](res.ok ? "Avis supprimé" : res.error ?? "Erreur");
    });
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Nom du client</Label>
          <Input
            className="h-9 w-48"
            value={d.author_name}
            onChange={(e) => setD({ ...d, author_name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Note</Label>
          <div className="flex h-9 items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`${n} étoiles`}
                onClick={() => setD({ ...d, rating: n })}
                className="p-0.5"
              >
                <Star
                  className={cn(
                    "size-5",
                    n <= d.rating ? "fill-[#F4B860] text-[#F4B860]" : "fill-transparent text-muted-foreground/40",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Ordre</Label>
          <Input
            type="number"
            className="h-9 w-20"
            value={d.sort_order}
            onChange={(e) => setD({ ...d, sort_order: Number(e.target.value) })}
          />
        </div>
        <label className="flex h-9 items-center gap-2 text-xs font-medium">
          <Switch checked={d.is_published} onCheckedChange={(v) => setD({ ...d, is_published: v })} />
          Publié
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Commentaire (FR)</Label>
          <Textarea
            rows={3}
            value={d.comment_fr ?? ""}
            onChange={(e) => setD({ ...d, comment_fr: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Commentaire (AR)</Label>
          <Textarea
            rows={3}
            dir="rtl"
            className="font-arabic"
            value={d.comment_ar ?? ""}
            onChange={(e) => setD({ ...d, comment_ar: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Photo (optionnel)</Label>
        <ImageUploader
          value={d.image_path ? [d.image_path] : []}
          onChange={(next) => setD({ ...d, image_path: next[0] ?? null })}
        />
      </div>

      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={pending}>
          Enregistrer
        </Button>
        {d.id && (
          <Button type="button" size="sm" variant="outline" onClick={remove} disabled={pending}>
            <Trash2 className="size-4" /> Supprimer
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProductReviewsEditor({
  productId,
  reviews,
}: {
  productId: string;
  reviews: ProductReviewRow[];
}) {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="max-w-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Avis clients</h2>
          <p className="text-sm text-muted-foreground">
            Affichés sous le produit (étoiles + nombre d&apos;avis). Décochez « Publié » pour masquer.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowNew((v) => !v)}>
          <Plus className="size-4" /> Ajouter un avis
        </Button>
      </div>

      {reviews.length === 0 && !showNew && (
        <p className="text-xs text-muted-foreground">Aucun avis pour ce produit.</p>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard key={r.id} initial={{ ...r }} productId={productId} />
        ))}
        {showNew && <ReviewCard initial={emptyDraft(productId)} productId={productId} />}
      </div>
    </div>
  );
}
