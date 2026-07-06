import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { enquiriesService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { ApiClientError } from "@/api/client";
import { getEnquiryId } from "@/lib/enquiry";
import type { Enquiry } from "@/types/enquiry";

interface DeleteEnquiryDialogProps {
  enquiry: Enquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteEnquiryDialog({ enquiry, open, onOpenChange }: DeleteEnquiryDialogProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => enquiriesService.remove(getEnquiryId(enquiry)),
    onSuccess: () => {
      toast.success("Enquiry deleted");
      void queryClient.invalidateQueries({ queryKey: queryKeys.enquiries.all });
      onOpenChange(false);
      navigate("/enquiries");
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Failed to delete enquiry");
    },
  });

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete enquiry"
      description={`Permanently delete ${enquiry.fullName} (${enquiry.enquiryCode})? This cannot be undone.`}
      confirmLabel="Delete"
      variant="destructive"
      loading={mutation.isPending}
      onConfirm={() => mutation.mutate()}
    />
  );
}
