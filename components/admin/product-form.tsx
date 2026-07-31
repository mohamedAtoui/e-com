"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";

import { createProduct, updateProduct } from "@/actions/products";
import { DescriptionBlocksEditor } from "@/components/admin/description-blocks-editor";
import { ImageUploader } from "@/components/admin/image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { productSchema, slugify, type ProductInput } from "@/lib/validators";
import type { ContentBlock, ProductRow } from "@/types/database.types";

export function ProductForm({ initial }: { initial?: ProductRow }) {
  const router = useRouter();
  const editing = Boolean(initial);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      slug: initial?.slug ?? "",
      name_fr: initial?.name_fr ?? "",
      name_ar: initial?.name_ar ?? "",
      description_fr: initial?.description_fr ?? "",
      description_ar: initial?.description_ar ?? "",
      price: initial?.price ?? 0,
      compare_at_price: initial?.compare_at_price ?? undefined,
      stock_quantity: initial?.stock_quantity ?? 0,
      is_active: initial?.is_active ?? true,
      category: initial?.category ?? "autre",
      images: initial?.images ?? [],
      offers: initial?.offers ?? [],
      description_blocks: initial?.description_blocks ?? [],
    },
  });

  const { fields: offerFields, append: appendOffer, remove: removeOffer } = useFieldArray({
    control,
    name: "offers",
  });

  const CATEGORIES: { value: string; label: string }[] = [
    { value: "lampe", label: "Lampe" },
    { value: "suspension", label: "Suspension" },
    { value: "applique", label: "Applique" },
    { value: "lanterne", label: "Lanterne" },
    { value: "autre", label: "Autre" },
  ];

  async function onSubmit(values: ProductInput) {
    const res = editing
      ? await updateProduct(initial!.id, values)
      : await createProduct(values);
    if (res.ok) {
      toast.success(editing ? "Produit mis à jour" : "Produit créé");
      router.push("/admin/products");
      router.refresh();
    } else {
      toast.error(res.error ?? "Erreur");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <Label>Images</Label>
        <Controller
          control={control}
          name="images"
          render={({ field }) => (
            <ImageUploader value={field.value ?? []} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name_fr">Nom (FR)</Label>
          <Input
            id="name_fr"
            {...register("name_fr", {
              onBlur: () => {
                if (!getValues("slug")) setValue("slug", slugify(getValues("name_fr")));
              },
            })}
          />
          {errors.name_fr && <p className="text-xs text-destructive">{errors.name_fr.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name_ar">Nom (AR) — الاسم</Label>
          <Input id="name_ar" dir="rtl" className="font-arabic" {...register("name_ar")} />
          {errors.name_ar && <p className="text-xs text-destructive">{errors.name_ar.message}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input id="slug" {...register("slug")} placeholder="mon-produit" />
          {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="category">Catégorie</Label>
          <select
            id="category"
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40"
            {...register("category")}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="description_fr">Description (FR)</Label>
          <Textarea id="description_fr" rows={5} {...register("description_fr")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description_ar">Description (AR) — الوصف</Label>
          <Textarea id="description_ar" rows={5} dir="rtl" className="font-arabic" {...register("description_ar")} />
        </div>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <div>
          <Label>Description enrichie (style Amazon)</Label>
          <p className="text-xs text-muted-foreground">
            Titres, paragraphes et images empilés, affichés en bas de la page produit.
          </p>
        </div>
        <Controller
          control={control}
          name="description_blocks"
          render={({ field }) => (
            <DescriptionBlocksEditor
              value={(field.value ?? []) as ContentBlock[]}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="price">Prix (DA)</Label>
          <Input id="price" type="number" min={0} {...register("price")} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="compare_at_price">Ancien prix (DA)</Label>
          <Input id="compare_at_price" type="number" min={0} {...register("compare_at_price")} />
          {errors.compare_at_price && (
            <p className="text-xs text-destructive">{errors.compare_at_price.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock_quantity">Stock</Label>
          <Input id="stock_quantity" type="number" min={0} {...register("stock_quantity")} />
          {errors.stock_quantity && (
            <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Offres / Promos</Label>
            <p className="text-xs text-muted-foreground">
              Prix total par quantité. Ex : 2 pièces = 3500 DA, 3 pièces = 5000 DA.
              Cochez « Livraison gratuite » pour offrir la livraison à cette quantité.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => appendOffer({ qty: 2, price: 0, free_delivery: false })}>
            + Ajouter une offre
          </Button>
        </div>

        {offerFields.length === 0 && (
          <p className="text-xs text-muted-foreground">Aucune offre. Le prix unitaire s'applique.</p>
        )}

        {offerFields.map((field, i) => (
          <div key={field.id} className="flex items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={`offers.${i}.qty`} className="text-xs">Quantité</Label>
              <Input
                id={`offers.${i}.qty`}
                type="number"
                min={2}
                max={99}
                className="w-24"
                {...register(`offers.${i}.qty` as const)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`offers.${i}.price`} className="text-xs">Prix total (DA)</Label>
              <Input
                id={`offers.${i}.price`}
                type="number"
                min={0}
                className="w-36"
                {...register(`offers.${i}.price` as const)}
              />
            </div>
            <label className="flex h-9 cursor-pointer items-center gap-2 text-xs font-medium">
              <input type="checkbox" {...register(`offers.${i}.free_delivery` as const)} />
              Livraison gratuite
            </label>
            <Button type="button" variant="outline" size="sm" onClick={() => removeOffer(i)}>
              Supprimer
            </Button>
          </div>
        ))}
        {errors.offers && typeof errors.offers.message === "string" && (
          <p className="text-xs text-destructive">{errors.offers.message}</p>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-lg border p-4">
        <Controller
          control={control}
          name="is_active"
          render={({ field }) => (
            <Switch checked={field.value} onCheckedChange={field.onChange} id="is_active" />
          )}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Produit actif (visible sur la boutique)
        </Label>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Enregistrement…" : editing ? "Mettre à jour" : "Créer le produit"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
