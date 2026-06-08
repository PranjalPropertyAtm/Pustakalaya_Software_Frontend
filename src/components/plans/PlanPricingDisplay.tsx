import { useQuery } from "@tanstack/react-query";
import { plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { typography } from "@/lib/typography";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { EffectivePlanPricingResult } from "@/hooks/usePlanPricing";
import { ApiClientError } from "@/api/client";

interface PlanPricingDisplayProps {
  planId: string;
  branchId?: string | null;
}

export function PlanPricingDisplay({ planId, branchId }: PlanPricingDisplayProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.plans.effectivePricing(planId, branchId ?? undefined),
    queryFn: async () => {
      try {
        return (await plansService.resolvePricing(
          planId,
          branchId ? { branchId } : {}
        )) as EffectivePlanPricingResult;
      } catch (err) {
        // New plans (like 10hr) may exist without pricing configured yet.
        // Treat 404 as "no pricing" instead of surfacing as an error.
        if (err instanceof ApiClientError && err.statusCode === 404) return null;
        throw err;
      }
    },
    enabled: Boolean(planId),
    staleTime: 30_000,
    retry: false,
  });

  if (isLoading) {
    return <p className={typography.paginationMeta}>Loading price…</p>;
  }

  if (isError || !data?.pricing) {
    return (
      <p className={cn(typography.paginationMeta, "italic")}>No pricing configured yet</p>
    );
  }

  const { pricing, source } = data;

  return (
    <div className="rounded-md border border-border/80 bg-muted/30 px-3 py-2 space-y-1">
      <p className={cn(typography.metricValue, "text-xl text-primary sm:text-xl")}>
        {formatCurrency(pricing.amount, pricing.currency)}
        <span className={cn(typography.paginationMeta, "font-normal")}> / month</span>
      </p>
      {pricing.effectiveFrom && (
        <p className={typography.muted}>
          Effective from {formatDate(pricing.effectiveFrom)}
        </p>
      )}
      {source === "BRANCH_OVERRIDE" && (
        <Badge variant="outline">
          Branch price
        </Badge>
      )}
    </div>
  );
}
