import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { enquiriesService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { ApiClientError } from "@/api/client";
import { getEnquiryId } from "@/lib/enquiry";
import type { Enquiry } from "@/types/enquiry";

interface CloseEnquiryDialogProps {
  enquiry: Enquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseEnquiryDialog({ enquiry, open, onOpenChange }: CloseEnquiryDialogProps) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const mutation = useMutation({
    mutationFn: () => enquiriesService.close(getEnquiryId(enquiry), { reason }),
    onSuccess: () => {
      toast.success("Enquiry closed");
      void queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
      onOpenChange(false);
      setReason("");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to close enquiry");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Close enquiry</DialogTitle>
          <DialogDescription>
            Mark {enquiry.fullName} ({enquiry.enquiryCode}) as closed. This action can be recorded with an optional reason.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="close-reason">Reason (optional)</Label>
            <Textarea
              id="close-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this enquiry being closed?"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Closing…" : "Close enquiry"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
