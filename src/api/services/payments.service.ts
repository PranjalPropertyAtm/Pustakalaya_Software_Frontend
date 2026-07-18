import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Payment, StudentPaymentSummary } from "@/types/domain";

export const paymentsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Payment[]; pagination?: { total: number; page: number; limit: number } }>(
      apiClient.get(endpoints.payments, { params })
    ),
  collect: (formData: FormData) =>
    unwrap(apiClient.post(endpoints.payments, formData)),
  getSummary: (studentIdOrCode: string, renewalId?: string) =>
    unwrap<StudentPaymentSummary>(
      apiClient.get(endpoints.paymentSummary(encodeURIComponent(studentIdOrCode.trim())), {
        params: renewalId ? { renewalId } : undefined,
      })
    ),
};
