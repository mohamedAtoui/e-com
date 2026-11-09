/** UUID filenames are never overwritten, so long browser caching is safe. */
export const IMAGE_CACHE_CONTROL = "31536000";
export type ImagePurpose = "product" | "description";

export function imageUploadSize(
  width: number,
  height: number,
  purpose: ImagePurpose,
) {
  if (!(width > 0 && height > 0) || !Number.isFinite(width * height))
    throw new Error("Dimensions d’image invalides.");
  // Keep long A+ descriptions readable instead of shrinking their entire height
  // into a thumbnail. Ordinary gallery photos use a smaller bounding box.
  const maxWidth = purpose === "description" ? 1280 : 1600;
  const maxHeight = purpose === "description" ? 16000 : 2000;
  const scale = Math.min(1, maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** Compress locally BEFORE sending any image bytes to Supabase. */
export async function prepareImageUpload(
  file: File,
  purpose: ImagePurpose = "product",
): Promise<File> {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)
  ) {
    throw new Error(
      "Utilisez une photo JPG, PNG, WebP ou AVIF (pas de GIF animé ni SVG).",
    );
  }
  if (file.size > 25 * 1024 * 1024)
    throw new Error(
      "Image trop volumineuse : 25 Mo maximum avant compression.",
    );
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "Impossible de lire cette image. Essayez une version JPG ou PNG.",
    );
  }
  try {
    if (bitmap.width * bitmap.height > 50_000_000)
      throw new Error("Image trop grande : 50 mégapixels maximum.");
    const size = imageUploadSize(bitmap.width, bitmap.height, purpose);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error(
        "Votre navigateur ne permet pas la compression des images.",
      );
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    const compressed = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(new Error("Échec de la compression de l’image.")),
        "image/webp",
        purpose === "description" ? 0.85 : 0.8,
      );
    });
    if (compressed.size > 2 * 1024 * 1024)
      throw new Error(
        "L’image reste trop lourde après compression (2 Mo maximum). Divisez les longues descriptions en plusieurs images.",
      );
    // If an already-small image is cheaper than its conversion, preserve it.
    // Resized originals must never be reused, even if the encoder grew the file.
    if (
      size.width === bitmap.width &&
      size.height === bitmap.height &&
      file.size <= compressed.size
    )
      return file;
    const ext =
      compressed.type === "image/webp"
        ? "webp"
        : compressed.type === "image/png"
          ? "png"
          : "jpg";
    return new File(
      [compressed],
      `${file.name.replace(/\.[^.]+$/, "")}.${ext}`,
      { type: compressed.type, lastModified: file.lastModified },
    );
  } finally {
    bitmap.close();
  }
}

export const IMAGE_UPLOAD_ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
