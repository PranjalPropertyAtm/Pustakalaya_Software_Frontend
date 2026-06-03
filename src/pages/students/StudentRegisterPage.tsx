import { useState, useEffect } from "react";
import { useForm, Controller, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { studentsService, branchesService, seatsService, plansService } from "@/api/services";
import {
  studentRegistrationSchema,
  createStudentRegistrationDefaultValues,
  type StudentRegistrationFormValues,
} from "@/schemas/student.schema";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { FormField } from "@/components/forms/FormField";
import { FileUploadField } from "@/components/forms/FileUploadField";
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileInput } from "@/components/forms/MobileInput";
import { mobileFieldRules, trimmedFieldRules } from "@/lib/inputHelpers";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryKeys } from "@/lib/queryKeys";
import { PAYMENT_METHODS } from "@/lib/constants";
import { getPlanId, getPlanLabel, isShiftBasedPlan } from "@/lib/plan";
import { usePlanPricing } from "@/hooks/usePlanPricing";
import { formatCurrency } from "@/lib/utils";
import { PlanScheduleFields } from "@/components/forms/PlanScheduleFields";
import { LoadingState } from "@/components/common/LoadingState";
import { ApiClientError } from "@/api/client";
import { getBranchId } from "@/lib/branch";
import { PlanSelect } from "@/components/forms/PlanSelect";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const { effectiveBranchId, isSuperAdmin } = useBranchContext();
  const [photo, setPhoto] = useState<File | null>(null);
  const [idProof, setIdProof] = useState<File | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentProofError, setPaymentProofError] = useState<string | null>(null);

  const form = useForm<StudentRegistrationFormValues>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: createStudentRegistrationDefaultValues(effectiveBranchId ?? ""),
  });

  useEffect(() => {
    if (effectiveBranchId) {
      form.setValue("branchId", effectiveBranchId);
    }
  }, [effectiveBranchId, form]);

  const branchId = form.watch("branchId");
  const planId = form.watch("planId");
  const shiftCode = form.watch("shiftCode");
  const seatId = form.watch("seatId");
  const durationMonths = form.watch("durationMonths") ?? 1;
  const collectPaymentNow = form.watch("collectPaymentNow");

  const {
    totalAmount,
    monthlyAmount,
    currency,
    isLoading: pricingLoading,
    isError: pricingError,
  } = usePlanPricing({ planId, branchId, durationMonths });

  useEffect(() => {
    if (!collectPaymentNow) return;
    if (totalAmount == null || Number.isNaN(totalAmount)) return;
    form.setValue("paymentAmount", totalAmount, { shouldValidate: true, shouldDirty: true });
    if (currency) {
      form.setValue("currency", currency);
    }
  }, [totalAmount, currency, form, collectPaymentNow]);

  useEffect(() => {
    if (collectPaymentNow) return;
    setPaymentProof(null);
    setPaymentProofError(null);
    form.setValue("paymentMethod", undefined);
    form.setValue("paymentReference", "");
    form.clearErrors(["paymentMethod", "paymentAmount"]);
  }, [collectPaymentNow, form]);

  useEffect(() => {
    form.setValue("seatId", "");
  }, [branchId, planId, shiftCode, form]);

  const { data: branches } = useQuery({
    queryKey: queryKeys.branches.list({}),
    queryFn: () => branchesService.list({ limit: 100, isActive: "true" }),
    enabled: isSuperAdmin,
  });

  const { data: plansData } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({ isActive: "true" }),
  });

  const selectedPlan = plansData?.items?.find((p) => getPlanId(p) === planId);
  const shiftBased = isShiftBasedPlan(selectedPlan);

  const { data: availability, isLoading: seatsLoading } = useQuery({
    queryKey: queryKeys.seats.availability({
      branchId,
      planId: planId || undefined,
      shiftCode: shiftBased ? shiftCode : undefined,
    }),
    queryFn: () =>
      seatsService.availability({
        branchId,
        planId,
        ...(shiftBased && shiftCode ? { shiftCode } : {}),
      }),
    enabled: !!branchId && !!planId,
  });

  const registerMutation = useMutation({
    mutationFn: (fd: FormData) => studentsService.register(fd),
    onSuccess: () => {
      toast.success("Student registered successfully");
      navigate("/students");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Registration failed");
    },
  });

  const onSubmit: SubmitHandler<StudentRegistrationFormValues> = (values) => {
    if (values.collectPaymentNow && !paymentProof) {
      setPaymentProofError("Payment screenshot is required when recording payment now");
      toast.error("Payment screenshot is required");
      return;
    }
    setPaymentProofError(null);

    const fd = new FormData();
    Object.entries(values).forEach(([k, v]) => {
      if (v === undefined || v === "") return;
      if (k === "collectPaymentNow") return;
      if (!shiftBased && k === "shiftCode") return;
      if (shiftBased && (k === "preferredStartTime" || k === "preferredEndTime")) return;
      if (!values.collectPaymentNow && (k === "paymentAmount" || k === "paymentMethod" || k === "paymentReference" || k === "currency")) {
        return;
      }
      fd.append(k, String(v));
    });
    fd.append("recordPaymentNow", values.collectPaymentNow ? "true" : "false");
    if (photo) fd.append("photo", photo);
    if (idProof) fd.append("idProof", idProof);
    if (values.collectPaymentNow && paymentProof) fd.append("paymentProof", paymentProof);
    registerMutation.mutate(fd);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title="Student Registration" description="Enroll a new library member with seat allocation" />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Personal details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" error={form.formState.errors.fullName} required>
              <Input {...form.register("fullName", trimmedFieldRules)} />
            </FormField>
            <FormField
              label="Mobile"
              error={form.formState.errors.mobileNumber}
              required
              hint="10-digit mobile number only"
            >
              <MobileInput {...form.register("mobileNumber", mobileFieldRules)} />
            </FormField>
            <FormField
              label="Parent contact"
              error={form.formState.errors.parentContact}
              hint="Optional — 10 digits"
            >
              <MobileInput {...form.register("parentContact", mobileFieldRules)} />
            </FormField>
            <FormField label="Email" error={form.formState.errors.email}>
              <Input type="email" {...form.register("email")} />
            </FormField>
            <FormField label="Address" error={form.formState.errors.address} required className="sm:col-span-2">
              <Textarea {...form.register("address", trimmedFieldRules)} />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Plan & seat</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {isSuperAdmin && (
              <FormField label="Branch" error={form.formState.errors.branchId} required>
                <Controller
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(v) => field.onChange(v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                      <SelectContent>
                        {(branches?.items ?? []).map((b) => {
                          const id = getBranchId(b);
                          return (
                            <SelectItem key={id} value={id}>{b.name}</SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            )}
            {!isSuperAdmin && effectiveBranchId && (
              <input type="hidden" {...form.register("branchId")} value={effectiveBranchId} />
            )}
            <PlanSelect
              control={form.control}
              error={form.formState.errors.planId}
            />
            <PlanScheduleFields
              control={form.control}
              watch={form.watch}
              setValue={form.setValue}
              errors={form.formState.errors}
              selectedPlan={selectedPlan}
            />
            <FormField label="Duration (months)" error={form.formState.errors.durationMonths}>
              <Input type="number" min={1} {...form.register("durationMonths", { valueAsNumber: true })} />
            </FormField>
            <FormField label="Joining date" error={form.formState.errors.joiningDate} required>
              <Input type="date" required {...form.register("joiningDate")} />
            </FormField>
            <FormField label="Start date" error={form.formState.errors.startDate} required>
              <Input type="date" required {...form.register("startDate")} />
            </FormField>
          </CardContent>
        </Card>

        {branchId && planId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Select seat</CardTitle>
              <SeatLegend />
            </CardHeader>
            <CardContent>
              {seatsLoading ? (
                <LoadingState />
              ) : (availability?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No seats are mapped to this plan yet. Map seats under Seat Map.
                </p>
              ) : (
                <SeatGrid
                  items={availability ?? []}
                  selectedSeatId={seatId}
                  shiftCode={shiftBased ? shiftCode : undefined}
                  planName={selectedPlan?.name}
                  onSelect={(id) => form.setValue("seatId", id, { shouldValidate: true, shouldDirty: true })}
                />
              )}
              {form.formState.errors.seatId && (
                <p className="text-xs text-destructive mt-2">{form.formState.errors.seatId.message}</p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Student photos</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Student profile photo and identity document (Aadhaar, etc.).
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FileUploadField label="Profile photo" value={photo} onChange={setPhoto} accept="image/*" />
            <FileUploadField label="ID proof" value={idProof} onChange={setIdProof} accept="image/*,.pdf" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
            <p className="text-sm text-muted-foreground font-normal mt-1">
              Fee is always recorded on the registration receipt. Enable the option below only if you are
              collecting payment right now.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border/80 bg-muted/30 p-4">
              <Controller
                control={form.control}
                name="collectPaymentNow"
                render={({ field }) => (
                  <Checkbox
                    id="collectPaymentNow"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                )}
              />
              <div className="space-y-1">
                <Label htmlFor="collectPaymentNow" className="cursor-pointer font-medium leading-none">
                  Record payment now at registration
                </Label>
                <p className="text-sm text-muted-foreground">
                  If unchecked, student is registered without a payment entry — collect fee later from
                  Payments.
                </p>
              </div>
            </div>

            {collectPaymentNow ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Payment amount"
                  error={form.formState.errors.paymentAmount}
                  required
                  hint={
                    !planId || !branchId
                      ? "Select branch and plan to load amount"
                      : pricingLoading
                        ? "Loading plan price…"
                        : pricingError
                          ? "No pricing for this branch — set it under Plans"
                          : monthlyAmount != null
                            ? `${formatCurrency(monthlyAmount, currency)}/month × ${durationMonths} month(s)${
                                selectedPlan ? ` (${getPlanLabel(selectedPlan)})` : ""
                              }`
                            : undefined
                  }
                >
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    readOnly={pricingLoading}
                    {...form.register("paymentAmount", { valueAsNumber: true })}
                  />
                </FormField>
                <input type="hidden" {...form.register("currency")} />
                <FormField label="Payment method" error={form.formState.errors.paymentMethod} required>
                  <Controller
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <Select value={field.value ?? ""} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHODS.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField label="Reference" error={form.formState.errors.paymentReference} className="sm:col-span-2">
                  <Input
                    {...form.register("paymentReference", trimmedFieldRules)}
                    placeholder="UPI / transaction ID (optional)"
                  />
                </FormField>
                <FileUploadField
                  label="Payment screenshot"
                  value={paymentProof}
                  onChange={(file) => {
                    setPaymentProof(file);
                    if (file) setPaymentProofError(null);
                  }}
                  accept="image/*"
                  error={paymentProofError ?? undefined}
                  className="sm:col-span-2"
                />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Plan fee will be calculated from branch pricing on the receipt. No payment proof needed until
                you collect payment separately.
              </p>
            )}

            <FormField label="Notes" error={form.formState.errors.notes} className="sm:col-span-2">
              <Textarea
                {...form.register("notes", trimmedFieldRules)}
                placeholder="Any notes about this registration"
              />
            </FormField>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate("/students")}>
            Cancel
          </Button>
          <Button type="submit" disabled={registerMutation.isPending}>
            {registerMutation.isPending ? "Registering..." : "Register student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
