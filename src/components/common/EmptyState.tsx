import type { LucideIcon } from "lucide-react";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center px-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/80 ring-1 ring-border/60">
        <Icon className="h-7 w-7 text-muted-foreground/70" />
      </div>
      <div className="max-w-sm">
        <h3 className={typography.emptyTitle}>{title}</h3>
        {description && <p className={cn("mt-1.5", typography.emptyDescription)}>{description}</p>}
      </div>
      {action}
    </div>
  );
}
