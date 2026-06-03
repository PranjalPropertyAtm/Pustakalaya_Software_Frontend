import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import { optimizeImageUrl } from "@/lib/image";

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  width: number;
  height: number;
  optimize?: boolean;
}

/** Image with explicit dimensions (prevents CLS), lazy loading, and optional Cloudinary transforms. */
export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width,
  height,
  optimize = true,
  className,
  ...props
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const resolvedSrc = optimize ? optimizeImageUrl(src, { width, height }) ?? src : src;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      className={cn(
        "transition-opacity duration-200",
        !loaded && "opacity-0",
        loaded && "opacity-100",
        className
      )}
      {...props}
    />
  );
});
