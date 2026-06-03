import type { Renewal } from "@/types/domain";

export function getRenewalId(renewal: Pick<Renewal, "id" | "_id">): string {
  return renewal.id ?? renewal._id ?? "";
}

export function formatRenewalStudentRef(studentId: string | undefined): string {
  if (!studentId) return "—";
  const id = String(studentId);
  return id.length > 6 ? id.slice(-6) : id;
}

export function renewalStatusVariant(
  status: string
): "success" | "warning" | "danger" | "secondary" | "outline" {
  switch (status) {
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "partial":
      return "secondary";
    case "pending":
      return "warning";
    default:
      return "outline";
  }
}

export const RENEWAL_STATUSES = ["pending", "partial", "completed", "cancelled"] as const;

export function renewalPaymentProgress(renewal: {
  expectedAmount?: number;
  amountPaid?: number;
}): number {
  const expected = renewal.expectedAmount ?? 0;
  if (expected <= 0) return 0;
  const paid = renewal.amountPaid ?? 0;
  return Math.min(100, Math.round((paid / expected) * 100));
}
