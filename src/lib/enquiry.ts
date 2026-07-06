import type { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { ENQUIRY_SOURCES, ENQUIRY_PURPOSES, ENQUIRY_STATUSES } from "@/schemas/enquiry.schema";

export function getEnquiryId(enquiry: Enquiry): string {
  return enquiry.id ?? enquiry._id ?? "";
}

export function enquirySourceLabel(source: string): string {
  return ENQUIRY_SOURCES.find((s) => s.value === source)?.label ?? source.replace(/_/g, " ");
}

export function enquiryPurposeLabel(purpose: string): string {
  return ENQUIRY_PURPOSES.find((p) => p.value === purpose)?.label ?? purpose.replace(/_/g, " ");
}

export function enquiryStatusLabel(status: string): string {
  return ENQUIRY_STATUSES.find((s) => s.value === status)?.label ?? status.replace(/_/g, " ");
}

export function enquiryStatusTone(status: EnquiryStatus | string) {
  switch (status) {
    case "new":
      return "neutral" as const;
    case "follow_up":
      return "warning" as const;
    case "interested":
      return "success" as const;
    case "not_interested":
      return "danger" as const;
    case "converted":
      return "success" as const;
    case "closed":
      return "neutral" as const;
    case "cancelled":
      return "danger" as const;
    default:
      return "neutral" as const;
  }
}

export function isEnquiryTerminal(status: string): boolean {
  return ["converted", "closed", "cancelled"].includes(status);
}
