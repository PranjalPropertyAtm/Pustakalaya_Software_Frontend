import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Plan } from "@/types/domain";

export const plansService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Plan[] }>(apiClient.get(endpoints.plans, { params })),
  getById: (id: string) => unwrap<Plan>(apiClient.get(endpoints.plan(id))),
  create: (body: Record<string, unknown>) =>
    unwrap<Plan>(apiClient.post(endpoints.plans, body)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<Plan>(apiClient.patch(endpoints.plan(id), body)),
  configurePricing: (id: string, body: Record<string, unknown>) =>
    unwrap(apiClient.post(endpoints.planPricing(id), body)),
  resolvePricing: (id: string, params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.planEffectivePricing(id), { params })),
};
