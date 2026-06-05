const SKIP_BELOW_BYTES = 200 * 1024;

/**
 * Resizes and re-encodes large photos before upload to cut registration time.
 * PDFs and small images are returned unchanged.
 */
export async function compressImageFile(
  file: File,
  { maxWidth = 1200, maxHeight = 1200, quality = 0.78 } = {}
): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;
  if (file.size <= SKIP_BELOW_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality)
  );
  if (!blob || blob.size >= file.size) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
}

export async function compressImageFiles(files: (File | null | undefined)[]): Promise<(File | null)[]> {
  return Promise.all(
    files.map(async (file) => {
      if (!file) return null;
      try {
        return await compressImageFile(file);
      } catch {
        return file;
      }
    })
  );
}
