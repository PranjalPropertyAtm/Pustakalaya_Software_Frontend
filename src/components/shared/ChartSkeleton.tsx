import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full w-full items-end justify-around gap-2 px-4 pb-6", className)} aria-hidden>
      {[40, 65, 50, 80, 55, 70].map((h, i) => (
        <Skeleton key={i} className="w-[12%] rounded-t-md" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
