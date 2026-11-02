import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserMinus } from "lucide-react";
import { studentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { getStudentId } from "@/lib/student";
import { ApiClientError } from "@/api/client";
import type { Student } from "@/types/domain";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface MarkStudentLeftDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLeft?: () => void;
}

export function MarkStudentLeftDialog({
  student,
  open,
  onOpenChange,
  onLeft,
}: MarkStudentLeftDialogProps) {
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      studentsService.setStatus(studentId, {
        status: "left",
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      }),
    onSuccess: () => {
      toast.success(`${student.fullName} marked as left`);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      queryClient.invalidateQueries({ queryKey: ["renewals"] });
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      setReason("");
      onOpenChange(false);
      onLeft?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Could not mark student as left"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) {
          if (!next) setReason("");
          onOpenChange(next);
        }
      }}
    >
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Mark student as left
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{student.fullName}</span>
            {student.studentCode ? ` (${student.studentCode})` : ""} will be marked as left.
        
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="left-reason">Reason (optional)</Label>
          <Textarea
            id="left-reason"
            value={reason}
            maxLength={300}
            placeholder="For example, shifted to another city"
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Mark as left"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
