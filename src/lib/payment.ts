import type { Payment } from "@/types/domain";

export function getPaymentId(payment: Pick<Payment, "id" | "_id">): string {
  return payment.id ?? payment._id ?? "";
}

export function getPaymentDate(payment: Payment): string | undefined {
  return payment.paidAt ?? payment.createdAt;
}

export function getPaymentMembershipStartDate(payment: Payment): string | undefined {
  return payment.membershipStartDate ?? payment.registration?.startDate ?? payment.student?.startDate ?? undefined;
}

export function getPaymentRegisteredOn(payment: Payment): string | undefined {
  return (
    payment.registeredOn ??
    payment.registration?.registeredAt ??
    payment.student?.registeredAt ??
    undefined
  );
}
