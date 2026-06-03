import { memo } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
}

function LogoInner({ variant = "full", className }: LogoProps) {
  if (variant === "icon") {
    return (
      <img
        src="/logo.png"
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/receipt-logo.svg";
        }}
        alt="Pustakalaya"
        width={36}
        height={36}
        loading="eager"
        decoding="async"
        className={cn("h-9 w-9 object-contain", className)}
      />
    );
  }

  return (
    <img
      src="/logo.png"
      onError={(e) => {
        (e.target as HTMLImageElement).src = "/receipt-logo.svg";
      }}
      alt="Pustakalaya — नया भारत शिक्षित भारत"
      width={280}
      height={48}
      loading="eager"
      decoding="async"
      className={cn("h-10 w-auto max-w-[200px] object-contain sm:h-12 sm:max-w-[280px]", className)}
    />
  );
}

export const Logo = memo(LogoInner);
