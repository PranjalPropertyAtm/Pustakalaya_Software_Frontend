import { useQuery } from "@tanstack/react-query";
import { plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { DEFAULT_CURRENCY } from "@/lib/constants";

export interface EffectivePlanPricingResult {
  pricing: {
    amount: number;
    currency: string;
    effectiveFrom?: string;
  };
  source: "BRANCH_OVERRIDE" | "GLOBAL_DEFAULT";
  evaluatedAt?: string;
}

export function usePlanPricing(params: {
  planId?: string;
  branchId?: string;
  durationMonths?: number;
}) {
  const { planId, branchId, durationMonths = 1 } = params;

  const query = useQuery({
    queryKey: queryKeys.plans.effectivePricing(planId ?? "", branchId, durationMonths),
    queryFn: () =>
      plansService.resolvePricing(planId!, { branchId: branchId! }) as Promise<EffectivePlanPricingResult>,
    enabled: Boolean(planId && branchId),
    staleTime: 30_000,
  });

  const monthlyAmount = query.data?.pricing?.amount;
  const currency = query.data?.pricing?.currency ?? DEFAULT_CURRENCY;
  const totalAmount =
    monthlyAmount != null && !Number.isNaN(monthlyAmount)
      ? monthlyAmount * durationMonths
      : undefined;

  return {
    ...query,
    monthlyAmount,
    totalAmount,
    currency,
    source: query.data?.source,
  };
}
