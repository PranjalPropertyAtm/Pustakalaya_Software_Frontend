import type { LucideIcon } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

/** @deprecated Prefer StatsCard from @/components/shared — kept for backward compatibility */
export function StatCard({ title, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <StatsCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={icon}
      trend={trend}
      className={cn(className)}
      accent="primary"
    />
  );
}
