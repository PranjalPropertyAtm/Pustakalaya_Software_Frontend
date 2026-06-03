import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { Check, ExternalLink } from "lucide-react";
import type { NotificationItem } from "@/types/domain";
import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { RowActionMenu, type RowAction } from "@/components/data-table";
import {
  formatNotificationLabel,
  getNotificationId,
  getNotificationMessage,
  getNotificationStudentLinkId,
  getNotificationStudentName,
} from "@/lib/notification";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function getNotificationColumns(handlers: {
  onMarkRead: (id: string) => void;
  onViewStudent?: (studentId: string) => void;
  markReadPending?: boolean;
}): ColumnDef<NotificationItem>[] {
  return [
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt).getTime(),
      header: "Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const n = row.original;
        const unread = n.status === "unread";
        return (
          <div className="min-w-[160px] max-w-xs">
            <p className={cn("font-medium leading-snug", unread && "text-foreground")}>
              {n.title}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {getNotificationMessage(n)}
            </p>
          </div>
        );
      },
    },
    {
      id: "student",
      header: "Student",
      accessorFn: (row) => getNotificationStudentName(row) ?? "",
      cell: ({ row }) => {
        const n = row.original;
        const name = getNotificationStudentName(n);
        const linkId = getNotificationStudentLinkId(n);
        if (!name) return <span className="text-muted-foreground">—</span>;
        if (!linkId) return <span className="font-medium">{name}</span>;
        return (
          <div className="min-w-[120px]">
            <Link
              to={`/students/${linkId}`}
              className="font-medium hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {name}
            </Link>
            {n.student?.studentCode && (
              <p className="text-xs text-muted-foreground">{n.student.studentCode}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => formatNotificationLabel(row.original.category),
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <StatusBadge
          label={formatNotificationLabel(row.original.priority)}
          tone={statusToneFromValue(row.original.priority, {
            urgent: "danger",
            high: "warning",
            normal: "neutral",
            low: "neutral",
          })}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={formatNotificationLabel(row.original.status)}
          tone={statusToneFromValue(row.original.status, {
            unread: "primary",
            read: "success",
            archived: "neutral",
          })}
        />
      ),
    },
    {
      id: "branch",
      header: "Branch",
      accessorFn: (row) => row.branch?.name ?? "—",
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const n = row.original;
        const id = getNotificationId(n);
        const actions: RowAction[] = [];

        const studentLinkId = getNotificationStudentLinkId(n);
        if (studentLinkId && handlers.onViewStudent) {
          actions.push({
            label: "View student",
            icon: <ExternalLink className="h-4 w-4" />,
            onClick: () => handlers.onViewStudent!(studentLinkId),
          });
        }
        if (n.status === "unread") {
          actions.push({
            label: "Mark as read",
            icon: <Check className="h-4 w-4" />,
            onClick: () => handlers.onMarkRead(id),
          });
        }

        if (actions.length === 0) return null;

        return (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {n.status === "unread" && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 hidden sm:inline-flex"
                disabled={handlers.markReadPending}
                onClick={() => handlers.onMarkRead(id)}
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            {getNotificationStudentLinkId(n) && (
              <Button size="sm" variant="ghost" className="h-8" asChild>
                <Link to={`/students/${getNotificationStudentLinkId(n)}`}>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
            <RowActionMenu actions={actions} />
          </div>
        );
      },
    },
  ];
}
