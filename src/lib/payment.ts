import type { Payment } from "@/types/domain";

export function getPaymentId(payment: Pick<Payment, "id" | "_id">): string {
  return payment.id ?? payment._id ?? "";
}

export function getPaymentDate(payment: Payment): string | undefined {
  return payment.paidAt ?? payment.createdAt;
}
