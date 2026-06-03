import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Receipt } from "@/types/domain";

export const receiptsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Receipt[]; pagination?: { total: number } }>(
      apiClient.get(endpoints.studentReceipts, { params })
    ),
  getById: (studentId: string, receiptId: string) =>
    unwrap<Receipt>(apiClient.get(endpoints.studentReceipt(studentId, receiptId))),
};
