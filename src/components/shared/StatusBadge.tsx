import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info" | "primary";

const toneMap: Record<StatusTone, BadgeProps["variant"]> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "outline",
  info: "secondary",
  primary: "default",
};

export function statusToneFromValue(
  value: string,
  map?: Partial<Record<string, StatusTone>>
): StatusTone {
  const key = value.toLowerCase();
  if (map?.[key]) return map[key]!;
  if (["active", "completed", "paid", "vacant"].includes(key)) return "success";
  if (["pending", "partial", "reserved", "expiring_soon", "inactive", "expired"].includes(key))
    return "warning";
  if (["cancelled", "failed", "suspended", "occupied"].includes(key)) return "danger";
  return "neutral";
}

interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  label: string;
  tone?: StatusTone;
}

export function StatusBadge({ label, tone = "neutral", className, ...props }: StatusBadgeProps) {
  return (
    <Badge variant={toneMap[tone]} className={cn("font-medium capitalize", className)} {...props}>
      {label}
    </Badge>
  );
}
