import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { PLAN_NAMES } from "@/lib/constants";
import { createPlanSchema, planPricingSchema, type CreatePlanFormValues, type PlanPricingFormValues } from "@/schemas/plan.schema";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { LoadingState } from "@/components/common/LoadingState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { formatCurrency } from "@/lib/utils";
import { getPlanId } from "@/lib/plan";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PlanPricingDisplay } from "@/components/plans/PlanPricingDisplay";

export default function PlansPage() {
  const { effectiveBranchId, isSuperAdmin } = useBranchContext();
  const queryClient = useQueryClient();
  const [pricingPlanId, setPricingPlanId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({}),
  });

  const createForm = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: { name: "12hr" },
  });

  const pricingForm = useForm<PlanPricingFormValues>({
    resolver: zodResolver(planPricingSchema),
    defaultValues: { currency: "INR", amount: 0 },
  });

  const createMutation = useMutation({
    mutationFn: plansService.create,
    onSuccess: () => {
      toast.success("Plan created");
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      createForm.reset();
    },
    onError: () => toast.error("Failed to create plan"),
  });

  const pricingMutation = useMutation({
    mutationFn: ({ planId, body }: { planId: string; body: PlanPricingFormValues }) =>
      plansService.configurePricing(planId, {
        ...body,
        effectiveFrom: new Date(body.effectiveFrom).toISOString(),
      }),
    onSuccess: (_data, { planId }) => {
      toast.success("Pricing updated");
      setPricingPlanId(null);
      pricingForm.reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.plans.effectivePricing(planId, effectiveBranchId ?? undefined),
      });
    },
  });

  if (isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans"
        description={
          isSuperAdmin && effectiveBranchId
            ? "Subscription plans — prices shown for the selected branch"
            : "Subscription plans and monthly pricing"
        }
        actions={
          isSuperAdmin && (
            <Dialog>
              <DialogTrigger asChild>
                <Button>Add plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create plan</DialogTitle></DialogHeader>
                <form onSubmit={createForm.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
                  <FormField label="Plan type" error={createForm.formState.errors.name} required>
                    <Controller
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v)}
                        >
                          <SelectTrigger><SelectValue placeholder="Select plan type" /></SelectTrigger>
                          <SelectContent>
                            {PLAN_NAMES.map((n) => (
                              <SelectItem key={n} value={n}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </FormField>
                  <Button type="submit" disabled={createMutation.isPending}>Create</Button>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.items ?? []).map((plan) => {
          const planId = getPlanId(plan);
          return (
          <Card key={planId}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg capitalize">{plan.name}</CardTitle>
              <Badge variant={plan.isActive ? "success" : "outline"}>
                {plan.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {plan.occupancyType?.replace(/_/g, " ") ?? "Standard occupancy"}
              </p>
              {plan.shiftTimings?.map((s) => (
                <p key={s.code} className="text-xs">
                  Shift {s.code}: {s.startTime} – {s.endTime}
                </p>
              ))}
              <PlanPricingDisplay planId={planId} branchId={effectiveBranchId} />
              {isSuperAdmin && (
                <Dialog open={pricingPlanId === planId} onOpenChange={(o) => !o && setPricingPlanId(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setPricingPlanId(planId)}>
                      Set pricing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Pricing — {plan.name}</DialogTitle></DialogHeader>
                    <form
                      onSubmit={pricingForm.handleSubmit((v) =>
                        pricingMutation.mutate({ planId, body: v })
                      )}
                      className="space-y-4"
                    >
                      <FormField label="Amount" error={pricingForm.formState.errors.amount} required>
                        <Input type="number" {...pricingForm.register("amount", { valueAsNumber: true })} />
                      </FormField>
                      <FormField label="Effective from" error={pricingForm.formState.errors.effectiveFrom} required>
                        <Input type="date" {...pricingForm.register("effectiveFrom")} />
                      </FormField>
                      <p className="text-xs text-muted-foreground">
                        Preview: {formatCurrency(pricingForm.watch("amount") || 0)}
                      </p>
                      <Button type="submit">Save pricing</Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
}
