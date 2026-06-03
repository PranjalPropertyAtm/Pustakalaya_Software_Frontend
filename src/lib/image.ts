const CLOUDINARY_HOST = "res.cloudinary.com";

/** Apply Cloudinary fetch/transform params for smaller, responsive images. */
export function optimizeImageUrl(
  url: string | undefined,
  opts: { width?: number; height?: number; quality?: number } = {}
): string | undefined {
  if (!url) return undefined;

  const { width = 96, height = 96, quality = 80 } = opts;

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes(CLOUDINARY_HOST)) {
      const parts = parsed.pathname.split("/");
      const uploadIdx = parts.indexOf("upload");
      if (uploadIdx !== -1) {
        const transform = `c_fill,w_${width},h_${height},q_${quality},f_auto`;
        parts.splice(uploadIdx + 1, 0, transform);
        parsed.pathname = parts.join("/");
        return parsed.toString();
      }
    }
  } catch {
    /* non-URL string — return as-is */
  }

  return url;
}
