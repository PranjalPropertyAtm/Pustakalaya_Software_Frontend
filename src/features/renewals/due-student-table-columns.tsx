import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { Student } from "@/types/domain";
import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { getStudentId } from "@/lib/student";
import { formatNotificationLabel } from "@/lib/notification";
import { StartRenewalDialog } from "@/features/renewals/StartRenewalDialog";

export type DueStudentRow = Student & { dueType: "expiring" | "inactive" };

export function getDueStudentColumns(handlers: {
  openStudentIds: Set<string>;
  onRenewalStarted: () => void;
}): ColumnDef<DueStudentRow>[] {
  return [
    {
      id: "endDate",
      accessorFn: (row) => (row.endDate ? new Date(row.endDate).getTime() : 0),
      header: "End date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.original.endDate ? formatDate(row.original.endDate) : "—"}
        </span>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Student",
      cell: ({ row }) => {
        const s = row.original;
        const id = getStudentId(s);
        return (
          <div>
            <Link
              to={`/students/${id}`}
              className="font-medium hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {s.fullName}
            </Link>
            {s.studentCode && (
              <p className="text-xs text-muted-foreground">{s.studentCode}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile",
    },
    {
      id: "dueType",
      accessorKey: "dueType",
      header: "Due type",
      cell: ({ row }) => (
        <StatusBadge
          label={row.original.dueType === "expiring" ? "Expiring soon" : "Inactive"}
          tone={row.original.dueType === "expiring" ? "warning" : "neutral"}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={formatNotificationLabel(row.original.status)}
          tone={statusToneFromValue(row.original.status)}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original;
        const id = getStudentId(s);
        const hasOpen = handlers.openStudentIds.has(id);

        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {hasOpen ? (
              <span className="text-xs text-muted-foreground">In progress</span>
            ) : (
              <StartRenewalDialog
                student={s}
                onSuccess={handlers.onRenewalStarted}
                trigger={
                  <Button size="sm" className="shadow-sm" disabled={!id}>
                    Start renewal
                  </Button>
                }
              />
            )}
          </div>
        );
      },
    },
  ];
}
