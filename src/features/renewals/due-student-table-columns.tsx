import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { Renewal, Student } from "@/types/domain";
import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { getStudentId } from "@/lib/student";
import { RENEWALS_RETURN_PATH } from "@/lib/studentsListUrl";
import { daysOverdue, getRenewalId } from "@/lib/renewal";
import { formatNotificationLabel } from "@/lib/notification";
import { StartRenewalDialog } from "@/features/renewals/StartRenewalDialog";

export type DueStudentRow = Student & { dueType: "expiring" | "overdue" };

export function getDueStudentColumns(handlers: {
  pendingRenewalByStudentId: Map<string, Renewal>;
  onCancelRenewal: (renewal: Renewal) => void;
  cancelingRenewalId?: string | null;
}): ColumnDef<DueStudentRow>[] {
  return [
    {
      id: "endDate",
      accessorFn: (row) => (row.endDate ? new Date(row.endDate).getTime() : 0),
      header: "End date",
      cell: ({ row }) => {
        const overdueDays = daysOverdue(row.original.endDate);
        return (
          <div className="whitespace-nowrap tabular-nums">
            <span className={cn(overdueDays > 0 && "font-medium text-destructive")}>
              {row.original.endDate ? formatDate(row.original.endDate) : "—"}
            </span>
            {overdueDays > 0 && (
              <p className="text-xs text-destructive/80">
                {overdueDays} day{overdueDays === 1 ? "" : "s"} overdue
              </p>
            )}
          </div>
        );
      },
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
              state={{ returnTo: RENEWALS_RETURN_PATH }}
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
          label={row.original.dueType === "expiring" ? "Expiring soon" : "Overdue"}
          tone={row.original.dueType === "expiring" ? "warning" : "danger"}
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
        const pendingRenewal = handlers.pendingRenewalByStudentId.get(id);

        const renewalId = pendingRenewal ? getRenewalId(pendingRenewal) : "";
        const isCanceling = Boolean(
          renewalId && handlers.cancelingRenewalId && handlers.cancelingRenewalId === renewalId
        );

        return (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {pendingRenewal ? (
              <>
                <Button size="sm" variant="secondary" className="shadow-sm" asChild>
                  <Link
                    to={`/payments?tab=collect&studentId=${encodeURIComponent(id)}&renewalId=${encodeURIComponent(renewalId)}`}
                  >
                    Complete payment
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="shadow-sm"
                  disabled={isCanceling}
                  onClick={() => handlers.onCancelRenewal(pendingRenewal)}
                >
                  {isCanceling ? "Cancelling…" : "Cancel"}
                </Button>
              </>
            ) : (
              <StartRenewalDialog
                student={s}
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
