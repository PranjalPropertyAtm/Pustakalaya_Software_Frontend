import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { PLAN_NAMES } from "@/lib/constants";
import {
  createPlanSchema,
  default6hrShiftFormValues,
  formValuesToShiftTimings,
  planPricingSchema,
  shiftTimingsToFormValues,
  sixHrShiftTimingsSchema,
  type CreatePlanFormValues,
  type PlanPricingFormValues,
  type SixHrShiftFormValues,
} from "@/schemas/plan.schema";
import { SixHrShiftFields } from "@/components/plans/SixHrShiftFields";
import type { Plan } from "@/types/domain";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/forms/FormField";
import { LoadingState } from "@/components/common/LoadingState";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { formatCurrency } from "@/lib/utils";
import { getPlanId } from "@/lib/plan";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PlanPricingDisplay } from "@/components/plans/PlanPricingDisplay";
import { ApiClientError } from "@/api/client";

export default function PlansPage() {
  const { effectiveBranchId, isSuperAdmin } = useBranchContext();
  const queryClient = useQueryClient();
  const [pricingPlanId, setPricingPlanId] = useState<string | null>(null);
  const [shiftEditPlan, setShiftEditPlan] = useState<Plan | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({}),
  });

  const existingPlanNames = useMemo(
    () => new Set((data?.items ?? []).map((plan) => plan.name)),
    [data?.items]
  );

  const availablePlanNames = useMemo(
    () => PLAN_NAMES.filter((name) => !existingPlanNames.has(name)),
    [existingPlanNames]
  );

  const createForm = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
    defaultValues: {
      name: availablePlanNames[0] ?? "12hr",
      ...default6hrShiftFormValues,
    },
  });

  const selectedPlanName = createForm.watch("name");

  useEffect(() => {
    const current = createForm.getValues("name");
    if (availablePlanNames.length > 0 && !availablePlanNames.includes(current)) {
      createForm.setValue("name", availablePlanNames[0]);
    }
  }, [availablePlanNames, createForm]);

  const pricingForm = useForm<PlanPricingFormValues>({
    resolver: zodResolver(planPricingSchema),
    defaultValues: { currency: "INR", amount: 0 },
  });

  const shiftEditForm = useForm<SixHrShiftFormValues>({
    resolver: zodResolver(sixHrShiftTimingsSchema),
    defaultValues: default6hrShiftFormValues,
  });

  useEffect(() => {
    if (!shiftEditPlan) return;
    shiftEditForm.reset(shiftTimingsToFormValues(shiftEditPlan.shiftTimings));
  }, [shiftEditPlan, shiftEditForm]);

  const createMutation = useMutation({
    mutationFn: (values: CreatePlanFormValues) => {
      const body: Record<string, unknown> = { name: values.name };
      if (values.name === "6hr") {
        body.shiftTimings = formValuesToShiftTimings(values);
      }
      return plansService.create(body);
    },
    onSuccess: (_data, variables) => {
      toast.success("Plan created");
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
      const nextName =
        availablePlanNames.find((name) => name !== variables.name) ??
        PLAN_NAMES.find((name) => name !== variables.name);
      createForm.reset({
        name: nextName ?? "12hr",
        ...default6hrShiftFormValues,
      });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : "Failed to create plan"),
  });

  const shiftUpdateMutation = useMutation({
    mutationFn: ({ planId, values }: { planId: string; values: SixHrShiftFormValues }) =>
      plansService.update(planId, { shiftTimings: formValuesToShiftTimings(values) }),
    onSuccess: () => {
      toast.success("Shift timings updated");
      setShiftEditPlan(null);
      shiftEditForm.reset(default6hrShiftFormValues);
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.all });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to update shift timings"),
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
                <Button disabled={availablePlanNames.length === 0}>Add plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create plan</DialogTitle>
                  <DialogDescription>
                    Choose a plan type that is not already in the library. For 6hr plans, set Shift A and Shift B timings (each must be 6 hours).
                  </DialogDescription>
                </DialogHeader>
                {availablePlanNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">All plan types are already configured.</p>
                ) : (
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
                              {availablePlanNames.map((n) => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormField>
                    {selectedPlanName === "6hr" && (
                      <SixHrShiftFields<CreatePlanFormValues>
                        register={createForm.register}
                        errors={createForm.formState.errors}
                      />
                    )}
                    <Button type="submit" disabled={createMutation.isPending}>Create</Button>
                  </form>
                )}
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
                {plan.durationHours ? ` · ${plan.durationHours}hr` : ""}
              </p>
              {plan.shiftTimings?.length ? null : plan.durationHours ? (
                <p className="text-xs text-muted-foreground">
                  Daily start/end time set when registering a student
                </p>
              ) : null}
              {plan.shiftTimings?.map((s) => (
                <p key={s.code} className="text-xs">
                  Shift {s.code}: {s.startTime} – {s.endTime}
                </p>
              ))}
              <PlanPricingDisplay planId={planId} branchId={effectiveBranchId} />
              {isSuperAdmin && (
                <div className="flex flex-wrap gap-2">
                {plan.name === "6hr" && (
                  <Dialog
                    open={shiftEditPlan !== null && getPlanId(shiftEditPlan) === planId}
                    onOpenChange={(open) => !open && setShiftEditPlan(null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setShiftEditPlan(plan)}>
                        Edit timings
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Shift timings — 6hr</DialogTitle>
                        <DialogDescription>
                          Update Shift A and Shift B schedules. Each shift must be exactly 6 hours.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={shiftEditForm.handleSubmit((values) =>
                          shiftUpdateMutation.mutate({ planId, values })
                        )}
                        className="space-y-4"
                      >
                        <SixHrShiftFields<SixHrShiftFormValues>
                          register={shiftEditForm.register}
                          errors={shiftEditForm.formState.errors}
                        />
                        <Button type="submit" disabled={shiftUpdateMutation.isPending}>
                          {shiftUpdateMutation.isPending ? "Saving..." : "Save timings"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                <Dialog open={pricingPlanId === planId} onOpenChange={(o) => !o && setPricingPlanId(null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setPricingPlanId(planId)}>
                      Set pricing
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pricing — {plan.name}</DialogTitle>
                      <DialogDescription>
                        Set the monthly amount and the date from which this price applies.
                      </DialogDescription>
                    </DialogHeader>
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
                </div>
              )}
            </CardContent>
          </Card>
        );
        })}
      </div>
    </div>
  );
}
