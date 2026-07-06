import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { followUpFormSchema, type FollowUpFormValues } from "@/schemas/enquiry.schema";
import { enquiriesService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/api/client";
import { getEnquiryId } from "@/lib/enquiry";
import type { Enquiry } from "@/types/enquiry";

interface AddFollowUpDialogProps {
  enquiry: Enquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFollowUpDialog({ enquiry, open, onOpenChange }: AddFollowUpDialogProps) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      followUpDate: today,
      followUpTime: "10:00",
      remark: "",
      nextFollowUpDate: "",
      nextFollowUpTime: "",
      reminderSet: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FollowUpFormValues) =>
      enquiriesService.addFollowUp(getEnquiryId(enquiry), {
        followUpDate: values.followUpDate,
        followUpTime: values.followUpTime || undefined,
        remark: values.remark,
        nextFollowUpDate: values.nextFollowUpDate || null,
        nextFollowUpTime: values.nextFollowUpTime || undefined,
        reminderSet: values.reminderSet,
      }),
    onSuccess: () => {
      toast.success("Follow-up recorded");
      void queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to add follow-up");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add follow-up — {enquiry.fullName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Follow-up date" error={form.formState.errors.followUpDate} required>
              <Input type="date" {...form.register("followUpDate")} />
            </FormField>
            <FormField label="Time" error={form.formState.errors.followUpTime}>
              <Input type="time" {...form.register("followUpTime")} />
            </FormField>
          </div>
          <FormField label="Remark" error={form.formState.errors.remark} required>
            <Textarea rows={3} {...form.register("remark")} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Next follow-up date" error={form.formState.errors.nextFollowUpDate}>
              <Input type="date" {...form.register("nextFollowUpDate")} />
            </FormField>
            <FormField label="Next follow-up time" error={form.formState.errors.nextFollowUpTime}>
              <Input type="time" {...form.register("nextFollowUpTime")} />
            </FormField>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save follow-up"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
