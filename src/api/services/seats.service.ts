import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { Seat, SeatAvailabilityItem } from "@/types/domain";

export interface BulkMapSeatPlanPayload {
  branchId: string;
  planId: string;
  mapAll?: boolean;
  fromSeat?: number;
  toSeat?: number;
  seatNumbers?: string[];
  allowedShiftCodes?: ("A" | "B")[];
  isEnabled?: boolean;
}

export interface BulkMapSeatPlanResult {
  mapped: number;
  branchId: string;
  planId: string;
  planName?: string;
}

export const seatsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<Seat[]>(apiClient.get(endpoints.seats, { params })),
  availability: (params: Record<string, unknown>) =>
    unwrap<SeatAvailabilityItem[]>(
      apiClient.get(endpoints.seatAvailability, { params })
    ),
  bulkMapPlan: (body: BulkMapSeatPlanPayload) =>
    unwrap<BulkMapSeatPlanResult>(apiClient.post(endpoints.seatPlanBulkMap, body)),
  lock: (seatId: string, body?: Record<string, unknown>) =>
    unwrap(apiClient.patch(`${endpoints.seats}/${seatId}/lock`, body)),
  unlock: (seatId: string) =>
    unwrap(apiClient.patch(`${endpoints.seats}/${seatId}/unlock`)),
};
