import type { LucideIcon } from "lucide-react";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  accent?: "primary" | "secondary" | "neutral";
  className?: string;
}

const accentStyles = {
  primary: "from-primary/10 to-primary/5 text-primary",
  secondary: "from-secondary/10 to-secondary/5 text-secondary",
  neutral: "from-slate-100 to-slate-50 text-muted-foreground",
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "neutral",
  className,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-card transition-all hover:shadow-elevated hover:border-border",
        className
      )}
    >
      <div
        className={cn(
          "absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-80 blur-2xl transition-opacity group-hover:opacity-100",
          accentStyles[accent]
        )}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className={typography.metricLabel}>{title}</p>
          <p className={typography.metricValue}>{value}</p>
          {subtitle && <p className={typography.muted}>{subtitle}</p>}
          {trend && (
            <p
              className={cn(
                typography.metricTrend,
                trend.positive ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
            accentStyles[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
