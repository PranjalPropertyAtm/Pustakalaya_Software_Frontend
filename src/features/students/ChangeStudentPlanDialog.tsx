import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Unlock } from "lucide-react";
import { studentsService, plansService, seatsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { getStudentId } from "@/lib/student";
import {
  isShiftBasedPlan,
  getPlanDurationHours,
  addHoursToTime,
} from "@/lib/plan";
import { ApiClientError } from "@/api/client";
import type { SeatAvailabilityItem, Student } from "@/types/domain";
import { SHIFT_CODES } from "@/lib/constants";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChangeStudentPlanDialogProps {
  student: Student;
  onSuccess?: () => void;
}

export function ChangeStudentPlanDialog({ student, onSuccess }: ChangeStudentPlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [shiftCode, setShiftCode] = useState<string | null>(null);
  const [preferredStartTime, setPreferredStartTime] = useState("");
  const [preferredEndTime, setPreferredEndTime] = useState("");
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);
  const branchId = student.branchId;

  const canChange =
    student.status === "active" &&
    Boolean(student.startDate && student.endDate);

  const { data: liveStudent, refetch: refetchStudent } = useQuery({
    queryKey: queryKeys.students.detail(studentId),
    queryFn: () => studentsService.getById(studentId),
    enabled: open,
    initialData: student,
  });

  const activeStudent = liveStudent ?? student;
  const hasActiveSeat = Boolean(
    activeStudent.currentAllocationId ?? activeStudent.currentSeatId ?? activeStudent.seat?.id
  );

  const { data: plansData, isLoading: plansLoading, isError: plansError } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({}),
    enabled: open,
    retry: false,
  });

  const plans = plansData?.items ?? [];
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId]
  );
  const shiftBased = isShiftBasedPlan(selectedPlan ?? undefined);
  const durationHours = getPlanDurationHours(selectedPlan);

  const {
    data: availability,
    isLoading: availabilityLoading,
    isError: availabilityError,
  } = useQuery({
    queryKey: queryKeys.seats.availability({
      branchId,
      planId: selectedPlanId,
      shiftCode: shiftBased ? shiftCode ?? undefined : undefined,
    }),
    queryFn: () =>
      seatsService.availability({
        branchId,
        planId: selectedPlanId,
        ...(shiftBased && shiftCode ? { shiftCode } : {}),
      }),
    enabled: open && Boolean(branchId && selectedPlanId && (!shiftBased || shiftCode)),
  });

  const currentPlanId = activeStudent.currentPlanId ?? activeStudent.plan?.id ?? "";
  const currentSeatId = activeStudent.currentSeatId ?? activeStudent.seat?.id ?? "";
  const formerSeatNumber = activeStudent.seat?.seatNumber ?? student.seat?.seatNumber;

  useEffect(() => {
    if (!open) return;
    setSelectedPlanId(currentPlanId);
    setShiftCode(activeStudent.currentShiftCode ?? null);
    setPreferredStartTime(activeStudent.preferredStartTime ?? "");
    setPreferredEndTime(activeStudent.preferredEndTime ?? "");
    setSelectedSeatId(hasActiveSeat ? currentSeatId : "");
  }, [open, currentPlanId, currentSeatId, activeStudent, hasActiveSeat]);

  useEffect(() => {
    if (!open || shiftBased || !preferredStartTime || !durationHours) return;
    setPreferredEndTime(addHoursToTime(preferredStartTime, durationHours));
  }, [open, preferredStartTime, durationHours, shiftBased]);

  useEffect(() => {
    if (!open || !currentSeatId || selectedSeatId) return;
    const match = (availability ?? []).find((x) => {
      const seatId = x.seat.id ?? x.seat._id;
      return String(seatId) === String(currentSeatId);
    });
    if (match) setSelectedSeatId(String(currentSeatId));
  }, [open, availability, currentSeatId, selectedSeatId]);

  const handlePlanChange = (planId: string) => {
    if (planId !== selectedPlanId) {
      const nextPlan = plans.find((p) => p.id === planId);
      if (isShiftBasedPlan(nextPlan)) {
        setShiftCode(activeStudent.currentShiftCode ?? "A");
        setPreferredStartTime("");
        setPreferredEndTime("");
      } else {
        setShiftCode(null);
        setPreferredStartTime(activeStudent.preferredStartTime ?? "");
        setPreferredEndTime(activeStudent.preferredEndTime ?? "");
      }
      if (currentSeatId) {
        setSelectedSeatId(currentSeatId);
      }
    }
    setSelectedPlanId(planId);
  };

  const hasChanges = useMemo(() => {
    const planChanged = selectedPlanId && selectedPlanId !== currentPlanId;
    const seatChanged = selectedSeatId && selectedSeatId !== currentSeatId;
    const shiftChanged = (shiftCode ?? null) !== (activeStudent.currentShiftCode ?? null);
    const timesChanged =
      (preferredStartTime || null) !== (activeStudent.preferredStartTime ?? null) ||
      (preferredEndTime || null) !== (activeStudent.preferredEndTime ?? null);
    return planChanged || seatChanged || shiftChanged || timesChanged;
  }, [
    selectedPlanId,
    currentPlanId,
    selectedSeatId,
    currentSeatId,
    shiftCode,
    activeStudent.currentShiftCode,
    preferredStartTime,
    preferredEndTime,
    activeStudent.preferredStartTime,
    activeStudent.preferredEndTime,
  ]);

  const canSubmit =
    Boolean(selectedPlanId && selectedSeatId) &&
    hasChanges &&
    (shiftBased ? Boolean(shiftCode) : Boolean(preferredStartTime && preferredEndTime));

  const releaseSeatMutation = useMutation({
    mutationFn: () => studentsService.releaseSeat(studentId),
    onSuccess: () => {
      toast.success("Seat released successfully");
      setSelectedSeatId("");
      void refetchStudent();
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Seat release failed");
    },
  });

  const changeMutation = useMutation({
    mutationFn: () =>
      studentsService.changePlan(studentId, {
        planId: selectedPlanId,
        seatId: selectedSeatId,
        ...(shiftBased && shiftCode ? { shiftCode } : {}),
        ...(!shiftBased && preferredStartTime && preferredEndTime
          ? { preferredStartTime, preferredEndTime }
          : {}),
      }),
    onSuccess: () => {
      toast.success("Plan updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.registrations(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.studentSummary(studentId) });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      setOpen(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to change plan");
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSelectedSeatId("");
    }
  };

  if (!canChange) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2 ml-2">
          <RefreshCw className="h-4 w-4 mr-1" />
          Change plan
        </Button>
      </DialogTrigger>
      <DialogContent className="flex w-[calc(100vw-1.5rem)] max-w-2xl max-h-[min(90dvh,calc(100vh-2rem))] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-6 sm:py-4">
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            {activeStudent.fullName}
            {activeStudent.plan?.name ? ` — current: ${activeStudent.plan.name}` : ""}
            {formerSeatNumber ? ` · Seat ${formerSeatNumber}` : ""}
        
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
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
            <>
              <FormField label="Plan" required>
                <Select value={selectedPlanId} onValueChange={handlePlanChange}>
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

              {shiftBased ? (
                <FormField label="Shift" required>
                  <Select value={shiftCode ?? ""} onValueChange={(v) => setShiftCode(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_CODES.map((c) => {
                        const timing = selectedPlan?.shiftTimings?.find((t) => t.code === c);
                        return (
                          <SelectItem key={c} value={c}>
                            Shift {c}
                            {timing ? ` (${timing.startTime} – ${timing.endTime})` : ""}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormField>
              ) : selectedPlan ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={`Start time (${durationHours}hr plan)`} required>
                    <Input
                      type="time"
                      value={preferredStartTime}
                      onChange={(e) => setPreferredStartTime(e.target.value)}
                    />
                  </FormField>
                  <FormField label={`End time (${durationHours}hr plan)`} required>
                    <Input
                      type="time"
                      value={preferredEndTime}
                      onChange={(e) => setPreferredEndTime(e.target.value)}
                    />
                  </FormField>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Label>Seat availability</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    {hasActiveSeat && formerSeatNumber && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => releaseSeatMutation.mutate()}
                        disabled={releaseSeatMutation.isPending || changeMutation.isPending}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        {releaseSeatMutation.isPending ? "Releasing…" : `Release seat ${formerSeatNumber}`}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSeatId("")}
                      disabled={!selectedSeatId}
                    >
                      Clear selection
                    </Button>
                  </div>
                </div>
               
                {hasActiveSeat && selectedSeatId === currentSeatId && currentSeatId && (
                  <p className="text-xs text-muted-foreground">
                    Same seat rakhni ho to release ki zaroorat nahi — seedha plan change kar sakte hain.
                    Vacant dikhane ke liye pehle &quot;Release seat&quot; dabayein.
                  </p>
                )}
                {availabilityLoading && <LoadingState />}
                {availabilityError && (
                  <ErrorState message="Could not load seat availability" />
                )}
                {!availabilityLoading && !availabilityError && (
                  <>
                    <SeatLegend />
                    {(availability ?? []).length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">
                        No seats mapped to this plan. Map seats under Seat Map first.
                      </p>
                    ) : (
                      <SeatGrid
                        items={(availability ?? []) as SeatAvailabilityItem[]}
                        selectedSeatId={selectedSeatId}
                        onSelect={setSelectedSeatId}
                        shiftCode={shiftBased ? shiftCode ?? undefined : undefined}
                        planName={selectedPlan?.name}
                        gridMaxHeightClass="max-h-[min(32dvh,240px)]"
                      />
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/60 px-4 py-3 sm:px-6">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit || changeMutation.isPending || releaseSeatMutation.isPending}
            onClick={() => changeMutation.mutate()}
          >
            {changeMutation.isPending ? "Saving…" : "Confirm plan change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
