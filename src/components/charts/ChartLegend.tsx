import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

export function ChartLegend({ items }: { items: { name: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 justify-center -mt-2">
      {items.map((item) => (
        <span key={item.name} className={cn(typography.chartLegend, "flex items-center gap-1")}>
          <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
          {item.name}
        </span>
      ))}
    </div>
  );
}
