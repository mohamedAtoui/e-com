"use client";

import { ArrowDown, ArrowUp, Heading, ImagePlus, Loader2, Text, Trash2, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import type { ContentBlock } from "@/types/database.types";

/**
 * Amazon-style rich-description builder: an ordered list of heading / paragraph
 * / image blocks. Text blocks are bilingual (FR + AR); images upload to the same
 * Storage bucket as product photos.
 */
export function DescriptionBlocksEditor({
  value,
  onChange,
}: {
  value: ContentBlock[];
  onChange: (next: ContentBlock[]) => void;
}) {
  const [uploadingAt, setUploadingAt] = useState<number | null>(null);

  const update = (i: number, patch: Partial<ContentBlock>) =>
    onChange(value.map((b, idx) => (idx === i ? ({ ...b, ...patch } as ContentBlock) : b)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (block: ContentBlock) => onChange([...value, block]);

  async function uploadImage(i: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploadingAt(i);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `desc/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });
    setUploadingAt(null);
    if (error) {
      toast.error("Échec de l'envoi de l'image.");
      return;
    }
    update(i, { src: path } as Partial<ContentBlock>);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Construisez une fiche détaillée : titres, paragraphes et images empilés (style Amazon).
        </p>
      )}

      {value.map((block, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {block.type === "heading" ? "Titre" : block.type === "paragraph" ? "Paragraphe" : "Image"}
            </span>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0} title="Monter">
                <ArrowUp className="size-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === value.length - 1} title="Descendre">
                <ArrowDown className="size-3.5" />
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} title="Supprimer">
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </div>
          </div>

          {block.type === "image" ? (
            <div className="space-y-2">
              {block.src ? (
                <div className="relative h-40 w-full overflow-hidden rounded-md border">
                  <Image src={productImageUrl(block.src)} alt={block.alt} fill sizes="(max-width:768px) 100vw, 640px" className="object-contain" />
                  <button
                    type="button"
                    onClick={() => update(i, { src: "" } as Partial<ContentBlock>)}
                    className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive shadow"
                    aria-label="Retirer l'image"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
                  {uploadingAt === i ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
                  <span className="text-xs">Choisir une image</span>
                  <input type="file" accept="image/*" className="sr-only" disabled={uploadingAt === i} onChange={(e) => uploadImage(i, e.target.files)} />
                </label>
              )}
              <Input
                placeholder="Texte alternatif (SEO / accessibilité)"
                value={block.alt}
                onChange={(e) => update(i, { alt: e.target.value } as Partial<ContentBlock>)}
              />
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs">FR</Label>
                {block.type === "heading" ? (
                  <Input value={block.fr} onChange={(e) => update(i, { fr: e.target.value } as Partial<ContentBlock>)} />
                ) : (
                  <Textarea rows={4} value={block.fr} onChange={(e) => update(i, { fr: e.target.value } as Partial<ContentBlock>)} />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">AR — العربية</Label>
                {block.type === "heading" ? (
                  <Input dir="rtl" className="font-arabic" value={block.ar} onChange={(e) => update(i, { ar: e.target.value } as Partial<ContentBlock>)} />
                ) : (
                  <Textarea rows={4} dir="rtl" className="font-arabic" value={block.ar} onChange={(e) => update(i, { ar: e.target.value } as Partial<ContentBlock>)} />
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => add({ type: "heading", fr: "", ar: "" })}>
          <Heading className="size-4" /> Titre
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add({ type: "paragraph", fr: "", ar: "" })}>
          <Text className="size-4" /> Paragraphe
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => add({ type: "image", src: "", alt: "" })}>
          <ImagePlus className="size-4" /> Image
        </Button>
      </div>
    </div>
  );
}
