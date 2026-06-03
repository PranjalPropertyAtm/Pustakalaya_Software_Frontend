import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface BulkAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
}

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  actions?: BulkAction[];
  className?: string;
}

export function BulkActionBar({ selectedCount, onClear, actions = [], className }: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 animate-in fade-in slide-in-from-top-1",
        className
      )}
    >
      <p className={typography.bodyMedium}>
        <span className="text-primary">{selectedCount}</span> selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((a) => (
          <Button key={a.label} size="sm" variant={a.variant ?? "outline"} onClick={a.onClick}>
            {a.label}
          </Button>
        ))}
        <Button size="sm" variant="ghost" onClick={onClear} className="gap-1">
          <X className="h-3.5 w-3.5" />
          Clear
        </Button>
      </div>
    </div>
  );
}
