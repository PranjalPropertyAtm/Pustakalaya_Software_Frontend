import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Branch } from "@/types/domain";

export const branchesService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: Branch[]; pagination?: { total: number } }>(
      apiClient.get(endpoints.branches, { params })
    ),
  getById: (id: string) => unwrap<Branch>(apiClient.get(endpoints.branch(id))),
  create: (body: Record<string, unknown>) =>
    unwrap<Branch & { seatsSync?: SeatsSyncResult }>(apiClient.post(endpoints.branches, body)),
  update: (id: string, body: Record<string, unknown>) =>
    unwrap<Branch & { seatsSync?: SeatsSyncResult }>(apiClient.patch(endpoints.branch(id), body)),
  syncSeats: (branchId: string) =>
    unwrap<{ branch: Branch; seatsSync: SeatsSyncResult }>(
      apiClient.post(endpoints.branchSyncSeats(branchId))
    ),
};

export interface SeatsSyncResult {
  totalSeats: number;
  created: number;
  reactivated: number;
  deactivated: number;
  activeSeats: number;
}
