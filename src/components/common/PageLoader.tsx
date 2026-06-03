import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  /** Show KPI-style skeleton cards above the table area. */
  withStats?: boolean;
}

/** Reusable route-level Suspense fallback — skeleton layout matching app pages. */
export function PageLoader({ className, withStats = false }: PageLoaderProps) {
  return (
    <div className={cn("space-y-6 animate-in fade-in duration-200", className)} aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withStats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}
