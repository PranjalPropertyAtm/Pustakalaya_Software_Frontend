import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { BranchCounsellor } from "@/types/counsellor";

export const counsellorsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: BranchCounsellor[] }>(apiClient.get(endpoints.auth.counsellors, { params })),
  create: (body: Record<string, unknown>) =>
    unwrap<BranchCounsellor>(apiClient.post(endpoints.auth.registerCounsellor, body)),
  update: (userId: string, body: Record<string, unknown>) =>
    unwrap<BranchCounsellor>(apiClient.patch(endpoints.auth.counsellor(userId), body)),
};
