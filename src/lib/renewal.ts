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

/** Whole days past endDate (0 if not yet overdue). */
export function daysOverdue(endDate: string | Date | undefined | null): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - end.getTime()) / (24 * 60 * 60 * 1000));
  return diff > 0 ? diff : 0;
}

export function renewalPaymentProgress(renewal: {
  expectedAmount?: number;
  amountPaid?: number;
}): number {
  const expected = renewal.expectedAmount ?? 0;
  if (expected <= 0) return 0;
  const paid = renewal.amountPaid ?? 0;
  return Math.min(100, Math.round((paid / expected) * 100));
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

/** Mirrors backend computeEndDate — last inclusive day of the membership term. */
export function computeRenewalEndDate(startDate: Date, durationMonths: number): Date {
  const next = addMonths(startDate, durationMonths);
  next.setDate(next.getDate() - 1);
  return next;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Default start = day after previous membership end, or today if none. */
export function computeDefaultRenewalStartDate(previousEndDate?: string | Date | null): string {
  if (!previousEndDate) return toDateInputValue(new Date());
  const prev = new Date(previousEndDate);
  prev.setHours(0, 0, 0, 0);
  prev.setDate(prev.getDate() + 1);
  return toDateInputValue(prev);
}
