import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
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

interface DeleteStudentDialogProps {
  student: Student;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteStudentDialog({
  student,
  open,
  onOpenChange,
  onDeleted,
}: DeleteStudentDialogProps) {
  const queryClient = useQueryClient();
  const studentId = getStudentId(student);

  const mutation = useMutation({
    mutationFn: () => studentsService.remove(studentId),
    onSuccess: (result) => {
      toast.success(`"${result.fullName}" deleted permanently`);
      queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["renewals"] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
      queryClient.invalidateQueries({ queryKey: ["seats"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      onOpenChange(false);
      onDeleted?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to delete student"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Delete student
          </DialogTitle>
          <DialogDescription>
            This will permanently delete{" "}
            <span className="font-medium text-foreground">{student.fullName}</span>
            {student.studentCode ? ` (${student.studentCode})` : ""} and all related records:
            registrations, renewals, payments, receipts, seat allocations, reminders, and
            notifications. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting…" : "Delete permanently"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
