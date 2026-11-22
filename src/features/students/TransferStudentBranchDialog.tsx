import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import { branchesService, seatsService, studentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchId } from "@/lib/branch";
import { getStudentId } from "@/lib/student";
import { isShiftBasedPlan } from "@/lib/plan";
import { staticQueryOptions } from "@/lib/queryDefaults";
import { ApiClientError } from "@/api/client";
import type { Student } from "@/types/domain";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { LoadingState } from "@/components/common/LoadingState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransferStudentBranchDialogProps {
  student: Student;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function TransferStudentBranchDialog({
  student,
  onSuccess,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: TransferStudentBranchDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const [branchId, setBranchId] = useState("");
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);
  const currentBranchId = student.branch?.id ?? student.branchId;
  const planId = student.currentPlanId ?? student.plan?.id;
  const shiftBased = isShiftBasedPlan(student.plan ?? undefined);
  const shiftCode = student.currentShiftCode ?? undefined;
  const canTransfer = student.status === "active" && Boolean(planId);

  const setOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (openProp === undefined) setUncontrolledOpen(next);
    if (!next) {
      setBranchId("");
      setSelectedSeatId("");
      setReason("");
    }
  };

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: queryKeys.branches.list({ limit: 100, isActive: "true" }),
    queryFn: () => branchesService.list({ limit: 100, isActive: "true" }),
    enabled: open,
    ...staticQueryOptions,
  });

  const destinations = (branchesData?.items ?? []).filter(
    (branch) => getBranchId(branch) !== currentBranchId
  );

  const { data: availability, isLoading: seatsLoading } = useQuery({
    queryKey: queryKeys.seats.availability({
      branchId,
      planId,
      shiftCode: shiftBased ? shiftCode : undefined,
    }),
    queryFn: () =>
      seatsService.availability({
        branchId,
        planId: planId!,
        ...(shiftBased && shiftCode ? { shiftCode } : {}),
      }),
    enabled: open && Boolean(branchId && planId),
  });

  const mutation = useMutation({
    mutationFn: () =>
      studentsService.transferBranch(studentId, {
        branchId,
        seatId: selectedSeatId,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      }),
    onSuccess: (updated) => {
      const branchName = updated.branch?.name ?? "the new branch";
      toast.success(`${student.fullName} transferred to ${branchName}`);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      setOpen(false);
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Could not transfer student");
    },
  });

  if (!canTransfer) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="mt-2">
            <Building2 className="h-4 w-4 mr-1" />
            Transfer branch
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="flex w-[calc(100vw-1.5rem)] max-w-2xl max-h-[min(90dvh,calc(100vh-2rem))] flex-col gap-4 overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Transfer to another branch</DialogTitle>
          <DialogDescription>
            {student.fullName}
            {student.branch?.name ? ` is at ${student.branch.name}` : ""}. The current membership
            stays the same. Their seat here is freed, and they take a seat at the new branch.
            Past payments stay on this branch.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="space-y-1.5">
            <Label>New branch</Label>
            {branchesLoading ? (
              <LoadingState />
            ) : destinations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No other active branch is available.</p>
            ) : (
              <Select
                value={branchId}
                onValueChange={(value) => {
                  setBranchId(value);
                  setSelectedSeatId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((branch) => {
                    const id = getBranchId(branch);
                    return (
                      <SelectItem key={id} value={id}>
                        {branch.name}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {branchId && (
            <>
              <SeatLegend />
              {seatsLoading ? (
                <LoadingState />
              ) : (availability?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No seats at this branch are mapped to {student.plan?.name ?? "this plan"}.
                </p>
              ) : (
                <SeatGrid
                  items={availability ?? []}
                  selectedSeatId={selectedSeatId}
                  onSelect={setSelectedSeatId}
                  shiftCode={shiftBased ? shiftCode : undefined}
                  planName={student.plan?.name}
                  gridMaxHeightClass="max-h-[min(32dvh,240px)]"
                />
              )}
            </>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="transfer-reason">Reason (optional)</Label>
            <Textarea
              id="transfer-reason"
              value={reason}
              maxLength={300}
              placeholder="For example, moved closer to the other branch"
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            disabled={!branchId || !selectedSeatId || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Transferring…" : "Transfer student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
