import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Enquiry } from "@/types/enquiry";
import { EnquiryForm } from "@/features/enquiries/EnquiryForm";

interface EditEnquiryDialogProps {
  enquiry: Enquiry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEnquiryDialog({ enquiry, open, onOpenChange }: EditEnquiryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit enquiry — {enquiry.enquiryCode}</DialogTitle>
        </DialogHeader>
        {open && (
          <EnquiryForm
            enquiry={enquiry}
            submitLabel="Update enquiry"
            onSuccess={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
