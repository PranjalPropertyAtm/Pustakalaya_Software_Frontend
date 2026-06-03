import type { NotificationItem } from "@/types/domain";

export function getNotificationId(n: Pick<NotificationItem, "id" | "_id">): string {
  return n.id ?? n._id ?? "";
}

export function getNotificationMessage(n: NotificationItem): string {
  return n.message ?? n.body ?? "";
}

export function getNotificationStudentName(n: NotificationItem): string | null {
  if (n.student?.fullName) return n.student.fullName;
  const meta = n.metadata;
  if (meta?.fullName && typeof meta.fullName === "string") return meta.fullName;
  if (meta?.studentName && typeof meta.studentName === "string") return meta.studentName;
  return null;
}

export function getNotificationStudentLinkId(n: NotificationItem): string | null {
  const id = n.student?.id ?? n.studentId;
  return id ? String(id) : null;
}

export function formatNotificationLabel(value?: string) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export type NotificationStatusFilter = "all" | "unread" | "read" | "archived";

export const NOTIFICATION_CATEGORIES = [
  "expiry_alert",
  "renewal_alert",
  "payment",
] as const;

export const NOTIFICATION_PRIORITIES = ["urgent", "high", "normal", "low"] as const;

export function notificationPriorityVariant(
  priority: string
): "danger" | "warning" | "outline" | "secondary" {
  switch (priority) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "normal":
      return "secondary";
    default:
      return "outline";
  }
}
