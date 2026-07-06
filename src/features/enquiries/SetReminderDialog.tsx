import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  reminderFormSchema,
  REMINDER_TYPES,
  type ReminderFormValues,
} from "@/schemas/enquiry.schema";
import { enquiriesService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiClientError } from "@/api/client";
import { getEnquiryId } from "@/lib/enquiry";
import type { Enquiry } from "@/types/enquiry";

interface SetReminderDialogProps {
  enquiry: Enquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetReminderDialog({ enquiry, open, onOpenChange }: SetReminderDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      reminderType: "call_tomorrow",
      title: "",
      message: "",
      offsetDays: 3,
      dueAt: "",
    },
  });

  const reminderType = form.watch("reminderType");

  const mutation = useMutation({
    mutationFn: (values: ReminderFormValues) =>
      enquiriesService.createReminder(getEnquiryId(enquiry), {
        reminderType: values.reminderType,
        title: values.title || undefined,
        message: values.message || undefined,
        offsetDays: values.offsetDays,
        dueAt: values.dueAt || undefined,
      }),
    onSuccess: () => {
      toast.success("Reminder scheduled");
      void queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
      onOpenChange(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to set reminder");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set reminder — {enquiry.fullName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v as ReminderFormValues))} className="space-y-4">
          <FormField label="Reminder type" error={form.formState.errors.reminderType} required>
            <Controller
              control={form.control}
              name="reminderType"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {REMINDER_TYPES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
          {reminderType === "call_after_days" && (
            <FormField label="Days from now" error={form.formState.errors.offsetDays} required>
              <Input type="number" min={1} max={365} {...form.register("offsetDays", { valueAsNumber: true })} />
            </FormField>
          )}
          {reminderType === "custom" && (
            <FormField label="Due date & time" error={form.formState.errors.dueAt} required>
              <Input type="datetime-local" {...form.register("dueAt")} />
            </FormField>
          )}
          <FormField label="Title (optional)" error={form.formState.errors.title}>
            <Input {...form.register("title")} placeholder="Custom title" />
          </FormField>
          <FormField label="Message (optional)" error={form.formState.errors.message}>
            <Textarea rows={2} {...form.register("message")} />
          </FormField>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Scheduling…" : "Schedule reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
