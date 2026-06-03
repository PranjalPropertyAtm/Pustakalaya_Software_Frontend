import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";

export const reportsService = {
  branchDashboard: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.branchDashboard, { params })),
  branchOccupancy: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.branchOccupancy, { params })),
  branchRevenue: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.branchRevenue, { params })),
  branchRenewalsDue: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.branchRenewalsDue, { params })),
  superDashboard: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.superDashboard, { params })),
  superComparison: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.superComparison, { params })),
  superPlanDistribution: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.reports.superPlanDistribution, { params })),
};
