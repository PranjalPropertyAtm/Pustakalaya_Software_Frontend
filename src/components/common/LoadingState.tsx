import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  variant?: "spinner" | "skeleton" | "overlay";
  label?: string;
  rows?: number;
  className?: string;
}

export function LoadingState({ variant = "spinner", label = "Loading...", rows = 4, className }: LoadingStateProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div className={cn("absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground", className)}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-normal text-muted-foreground">{label}</p>
    </div>
  );
}
