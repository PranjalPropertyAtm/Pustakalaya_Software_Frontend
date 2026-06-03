import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { CreditCard, X } from "lucide-react";
import type { Renewal } from "@/types/domain";
import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { RowActionMenu } from "@/components/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatNotificationLabel } from "@/lib/notification";
import {
  formatRenewalStudentRef,
  getRenewalId,
  renewalPaymentProgress,
} from "@/lib/renewal";
import { getStudentId } from "@/lib/student";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { cn } from "@/lib/utils";

const OPEN_STATUSES = new Set(["pending", "partial"]);

export function getRenewalColumns(handlers: {
  onCollectPayment: (renewal: Renewal) => void;
  onCancel: (id: string) => void;
  canceling?: boolean;
}): ColumnDef<Renewal>[] {
  return [
    {
      id: "createdAt",
      accessorFn: (row) => new Date(row.createdAt ?? 0).getTime(),
      header: "Date",
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {row.original.createdAt ? formatDate(row.original.createdAt) : "—"}
        </span>
      ),
    },
    {
      id: "renewalNumber",
      header: "Renewal #",
      accessorFn: (row) => row.renewalNumber ?? formatRenewalStudentRef(String(row.studentId)),
      cell: ({ row }) => (
        <span className="font-medium tabular-nums">
          {row.original.renewalNumber ??
            `···${formatRenewalStudentRef(String(row.original.studentId))}`}
        </span>
      ),
    },
    {
      id: "student",
      header: "Student",
      accessorFn: (row) => row.student?.fullName ?? String(row.studentId),
      cell: ({ row }) => {
        const r = row.original;
        const studentLinkId = r.student?.id ?? r.studentId;
        if (!studentLinkId) return "—";
        return (
          <div className="min-w-[120px]">
            <Link
              to={`/students/${getStudentId({ id: String(studentLinkId), _id: String(studentLinkId) })}`}
              className="font-medium hover:text-primary"
              onClick={(e) => e.stopPropagation()}
            >
              {r.student?.fullName ?? "View student"}
            </Link>
            {r.student?.studentCode && (
              <p className="text-xs text-muted-foreground">{r.student.studentCode}</p>
            )}
          </div>
        );
      },
    },
    {
      id: "paid",
      header: "Paid",
      accessorFn: (row) => row.amountPaid ?? 0,
      cell: ({ row }) => {
        const currency = row.original.currency ?? DEFAULT_CURRENCY;
        return formatCurrency(row.original.amountPaid ?? 0, currency);
      },
    },
    {
      id: "expected",
      header: "Expected",
      accessorFn: (row) => row.expectedAmount ?? 0,
      cell: ({ row }) => {
        const currency = row.original.currency ?? DEFAULT_CURRENCY;
        const v = row.original.expectedAmount;
        return v !== undefined ? formatCurrency(v, currency) : "—";
      },
    },
    {
      id: "balanceDue",
      header: "Due",
      accessorFn: (row) => row.balanceDue ?? 0,
      cell: ({ row }) => {
        const currency = row.original.currency ?? DEFAULT_CURRENCY;
        const due = row.original.balanceDue ?? 0;
        return (
          <span className={cn(due > 0 && "font-medium text-amber-600 dark:text-amber-500")}>
            {formatCurrency(due, currency)}
          </span>
        );
      },
    },
    {
      id: "progress",
      header: "Progress",
      accessorFn: (row) => renewalPaymentProgress(row),
      cell: ({ row }) => {
        const pct = renewalPaymentProgress(row.original);
        if (!row.original.expectedAmount) return "—";
        return (
          <div className="flex min-w-[72px] items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-primary")}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-muted-foreground">{pct}%</span>
          </div>
        );
      },
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
        const r = row.original;
        const id = getRenewalId(r);
        const isOpen = OPEN_STATUSES.has(r.status);
        if (!isOpen) return null;

        return (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <RowActionMenu
              actions={[
                {
                  label: "Collect payment",
                  icon: <CreditCard className="h-4 w-4" />,
                  onClick: () => handlers.onCollectPayment(r),
                },
                {
                  label: "Cancel renewal",
                  icon: <X className="h-4 w-4" />,
                  destructive: true,
                  onClick: () => handlers.onCancel(id),
                },
              ]}
            />
          </div>
        );
      },
    },
  ];
}
