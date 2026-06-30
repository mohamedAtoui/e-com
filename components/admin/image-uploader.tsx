"use client";

import { Loader2, Star, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { productImageUrl } from "@/lib/images";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();
    const added: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("product-images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) {
        toast.error(`Échec de l'envoi: ${file.name}`);
      } else {
        added.push(path);
      }
    }

    if (added.length) onChange([...value, ...added]);
    setUploading(false);
  }

  async function remove(path: string) {
    const supabase = createClient();
    const { error } = await supabase.storage.from("product-images").remove([path]);
    if (error) {
      toast.error("Échec de la suppression de l'image.");
      return;
    }
    onChange(value.filter((p) => p !== path));
  }

  function makeCover(path: string) {
    onChange([path, ...value.filter((p) => p !== path)]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {value.map((path, i) => (
          <div
            key={path}
            className={cn(
              "relative h-24 w-24 overflow-hidden rounded-lg border-2",
              i === 0 ? "border-primary" : "border-border",
            )}
          >
            <Image
              src={productImageUrl(path)}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => remove(path)}
              className="absolute right-1 top-1 rounded-full bg-background/80 p-0.5 text-destructive shadow"
              aria-label="Supprimer"
            >
              <X className="size-3.5" />
            </button>
            {i !== 0 && (
              <button
                type="button"
                onClick={() => makeCover(path)}
                className="absolute bottom-1 left-1 rounded-full bg-background/80 p-0.5 text-muted-foreground shadow"
                aria-label="Définir comme couverture"
              >
                <Star className="size-3.5" />
              </button>
            )}
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-primary/90 py-0.5 text-center text-[10px] text-primary-foreground">
                Couverture
              </span>
            )}
          </div>
        ))}

        <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <>
              <span className="text-2xl leading-none">+</span>
              <span className="text-xs">Image</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={uploading}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        La première image est la couverture. ⭐ pour changer.
      </p>
    </div>
  );
}
