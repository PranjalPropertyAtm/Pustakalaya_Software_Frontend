import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { renewalsService, plansService, seatsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { isShiftBasedPlan } from "@/lib/plan";
import type { Plan, SeatAvailabilityItem, Student } from "@/types/domain";
import { getStudentId } from "@/lib/student";
import { SHIFT_CODES } from "@/lib/constants";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { Label } from "@/components/ui/label";

function pickPlanIdFromStudent(student: Student, plans: Plan[]): string | null {
  const fromCurrent = student.currentPlanId || student.plan?.id || null;
  if (fromCurrent) return fromCurrent;
  // Fallback: use first active plan.
  return plans.find((p) => p.isActive)?.id ?? plans[0]?.id ?? null;
}

export function StartRenewalDialog({
  student,
  trigger,
  onSuccess,
}: {
  student: Student;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);
  const branchId = student.branchId;

  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [shiftCode, setShiftCode] = useState<string | null>(null);
  const [selectedSeatId, setSelectedSeatId] = useState<string>("");
  const currentSeatId = student.currentSeatId ?? student.seat?.id ?? "";
  const selectableSeatIds = useMemo(() => {
    return currentSeatId ? [String(currentSeatId)] : [];
  }, [currentSeatId]);

  const { data: plansData, isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({}),
    enabled: open,
    retry: false,
  });

  const plans = plansData?.items ?? [];
  const defaultPlanId = useMemo(() => {
    return pickPlanIdFromStudent(student, plans);
  }, [student, plans]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) ?? null;
  }, [plans, selectedPlanId]);

  const shiftBased = isShiftBasedPlan(selectedPlan ?? undefined);

  const { data: availability, isLoading: availabilityLoading, isError: availabilityError } = useQuery({
    queryKey: ["seats", "availability", "renewals", branchId, selectedPlanId, shiftCode],
    queryFn: () =>
      seatsService.availability({
        branchId,
        planId: selectedPlanId,
        ...(shiftBased && shiftCode ? { shiftCode } : {}),
      }),
    enabled: open && Boolean(branchId && selectedPlanId) && (!shiftBased || Boolean(shiftCode)),
    retry: false,
  });

  const startMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => renewalsService.initiate(body),
    onSuccess: () => {
      toast.success("Renewal started");
      queryClient.invalidateQueries({ queryKey: ["renewals"], exact: false });
      onSuccess?.();
      setOpen(false);
      setSelectedSeatId("");
    },
    onError: (err: Error) => toast.error(err.message || "Could not start renewal"),
  });

  useEffect(() => {
    if (!open) return;
    if (!defaultPlanId) return;
    setSelectedPlanId((prev) => prev || defaultPlanId);
    setShiftCode((prev) => prev ?? student.currentShiftCode ?? null);
  }, [open, defaultPlanId, student.currentShiftCode]);

  useEffect(() => {
    if (!open) return;
    if (!currentSeatId) return;
    if (selectedSeatId) return;
    const match = (availability ?? []).find((x) => {
      const seatId = x.seat.id ?? x.seat._id;
      return String(seatId) === String(currentSeatId);
    });
    if (match) setSelectedSeatId(String(currentSeatId));
  }, [open, availability, currentSeatId, selectedSeatId]);

  useEffect(() => {
    // Plan change should reset seat selection.
    setSelectedSeatId("");
    if (!shiftBased) setShiftCode(null);
  }, [selectedPlanId]);

  const canSubmit = Boolean(selectedSeatId && selectedPlanId) && (!shiftBased || Boolean(shiftCode));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 bg-muted/20 px-6 py-4">
          <DialogTitle>Start renewal</DialogTitle>
          <DialogDescription>
            Choose plan and seat for <span className="font-medium text-foreground">{student.fullName}</span>
            {student.studentCode ? ` (${student.studentCode})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {plansLoading && <LoadingState variant="skeleton" />}

          {plansError && (
            <ErrorState
              message="Could not load plans"
              onRetry={() => {
                queryClient.invalidateQueries({ queryKey: queryKeys.plans.list({}) });
              }}
            />
          )}

          {!plansLoading && !plansError && (
            <FormField label="Plan" required>
              <Select
                value={selectedPlanId}
                onValueChange={(v) => setSelectedPlanId(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          {shiftBased && (
            <FormField label="Shift" required>
              <Select value={shiftCode ?? ""} onValueChange={(v) => setShiftCode(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift" />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_CODES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Seat availability</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedSeatId("");
                }}
                disabled={!selectedSeatId}
              >
                Clear
              </Button>
            </div>
            {availabilityLoading && <LoadingState />}

            {availabilityError && (
              <ErrorState message="Could not load seat availability" />
            )}

            {!availabilityLoading && !availabilityError && (
              <>
                <SeatLegend />
                <div className="mt-2">
                  {(availability ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      No seats available for this plan.
                    </p>
                  ) : (
                    <SeatGrid
                      items={(availability ?? []) as SeatAvailabilityItem[]}
                      selectedSeatId={selectedSeatId}
                      onSelect={setSelectedSeatId}
                      selectableSeatIds={selectableSeatIds}
                      shiftCode={shiftBased ? shiftCode ?? undefined : undefined}
                      planName={selectedPlan?.name}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 bg-muted/10 px-6 py-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={startMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              startMutation.mutate({
                studentId,
                planId: selectedPlanId,
                seatId: selectedSeatId,
                ...(shiftBased ? { shiftCode } : {}),
              })
            }
            disabled={!canSubmit || startMutation.isPending}
          >
            {startMutation.isPending ? "Starting..." : "Start renewal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

