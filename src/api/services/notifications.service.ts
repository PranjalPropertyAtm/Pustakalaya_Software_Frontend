import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { NotificationItem } from "@/types/domain";

export const notificationsService = {
  list: (params?: Record<string, unknown>) =>
    unwrap<{ items: NotificationItem[]; total: number }>(
      apiClient.get(endpoints.notifications.list, { params })
    ),
  center: (params?: Record<string, unknown>) =>
    unwrap(apiClient.get(endpoints.notifications.center, { params })),
  unreadCount: (params?: Record<string, unknown>) =>
    unwrap<{ unreadCount: number; count?: number }>(
      apiClient.get(endpoints.notifications.unreadCount, { params })
    ),
  markAllRead: (params?: Record<string, unknown>) =>
    unwrap<{ modified: number }>(apiClient.patch(endpoints.notifications.readAll, {}, { params })),
  markRead: (id: string) =>
    unwrap(apiClient.patch(endpoints.notifications.read(id))),
};
