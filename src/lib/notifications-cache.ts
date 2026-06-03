import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { NotificationItem } from "@/types/domain";

/** Optimistically mark every cached notification list row as read and reset unread counts. */
export function applyMarkAllReadToCache(queryClient: QueryClient) {
  const readAt = new Date().toISOString();

  queryClient.setQueriesData<{ items: NotificationItem[]; unreadCount?: number }>(
    { queryKey: ["notifications", "list"] },
    (old) => {
      if (!old?.items) return old;
      return {
        ...old,
        unreadCount: 0,
        items: old.items.map((n) =>
          n.status === "unread" ? { ...n, status: "read" as const, readAt } : n
        ),
      };
    }
  );

  queryClient.setQueriesData<{ unreadCount: number; count?: number }>(
    { queryKey: ["notifications", "unread"] },
    () => ({ unreadCount: 0, count: 0 })
  );
}

export function invalidateNotificationQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
}
