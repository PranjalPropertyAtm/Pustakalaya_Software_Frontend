import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Renewal } from "@/types/domain";

export const renewalsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Renewal[]; total: number }>(
      apiClient.get(endpoints.renewals, { params })
    ),
  initiate: (body: Record<string, unknown>) =>
    unwrap<Renewal>(apiClient.post(endpoints.renewals, body)),
  complete: (id: string, body?: Record<string, unknown>) =>
    unwrap(apiClient.post(endpoints.renewalComplete(id), body ?? {})),
  cancel: (id: string) => unwrap(apiClient.post(endpoints.renewalCancel(id))),
};
