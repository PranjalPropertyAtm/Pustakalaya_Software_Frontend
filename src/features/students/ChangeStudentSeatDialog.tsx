import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import { studentsService, seatsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { getStudentId } from "@/lib/student";
import { isShiftBasedPlan } from "@/lib/plan";
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
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { LoadingState } from "@/components/common/LoadingState";

interface ChangeStudentSeatDialogProps {
  student: Student;
  onSuccess?: () => void;
}

export function ChangeStudentSeatDialog({ student, onSuccess }: ChangeStudentSeatDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSeatId, setSelectedSeatId] = useState("");
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);
  const branchId = student.branchId;
  const planId = student.currentPlanId ?? student.plan?.id;
  const shiftBased = isShiftBasedPlan(student.plan ?? undefined);
  const shiftCode = student.currentShiftCode ?? undefined;

  const canChange =
    student.status === "active" &&
    Boolean(student.currentAllocationId ?? student.currentSeatId);

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

  const currentSeatId = student.currentSeatId ?? student.seat?.id;

  const changeMutation = useMutation({
    mutationFn: (seatId: string) => studentsService.changeSeat(studentId, { seatId }),
    onSuccess: () => {
      toast.success("Seat updated successfully");
      queryClient.invalidateQueries({ queryKey: queryKeys.students.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      setOpen(false);
      setSelectedSeatId("");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to change seat");
    },
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setSelectedSeatId("");
  };

  if (!canChange) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          <ArrowRightLeft className="h-4 w-4 mr-1" />
          Change seat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change seat</DialogTitle>
          <DialogDescription>
            {student.fullName}
            {student.seat ? ` — current: Seat ${student.seat.seatNumber}` : ""}
            {student.plan?.name ? ` · ${student.plan.name}` : ""}
            {shiftBased && shiftCode ? ` · Shift ${shiftCode}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <SeatLegend />
          {seatsLoading ? (
            <LoadingState />
          ) : (availability?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No seats mapped to this plan. Map seats under Seat Map first.
            </p>
          ) : (
            <SeatGrid
              items={availability ?? []}
              selectedSeatId={selectedSeatId}
              onSelect={setSelectedSeatId}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={
              !selectedSeatId ||
              selectedSeatId === currentSeatId ||
              changeMutation.isPending
            }
            onClick={() => changeMutation.mutate(selectedSeatId)}
          >
            {changeMutation.isPending ? "Saving…" : "Confirm new seat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
