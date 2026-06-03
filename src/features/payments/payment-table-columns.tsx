import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import type { Payment } from "@/types/domain";
import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getPaymentDate, getPaymentId } from "@/lib/payment";
import { getStudentId } from "@/lib/student";
import { DEFAULT_CURRENCY } from "@/lib/constants";

function formatPaymentType(type?: string) {
  if (!type) return "—";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function getPaymentColumns(showStudent = true): ColumnDef<Payment>[] {
  const cols: ColumnDef<Payment>[] = [
    {
      id: "date",
      header: "Date",
      accessorFn: (row) => getPaymentDate(row),
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined;
        return v ? formatDate(v) : "—";
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) =>
        formatCurrency(row.original.amount, row.original.currency ?? DEFAULT_CURRENCY),
    },
  ];

  if (showStudent) {
    cols.push({
      id: "student",
      header: "Student",
      accessorFn: (row) => row.student?.fullName ?? row.studentId,
      cell: ({ row }) => {
        const p = row.original;
        const studentLinkId = p.student?.id ?? p.studentId;
        if (!studentLinkId) return "—";
        return p.student?.fullName ? (
          <Link
            to={`/students/${getStudentId({ id: studentLinkId, _id: studentLinkId })}`}
            className="font-medium hover:text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {p.student.fullName}
          </Link>
        ) : (
          String(studentLinkId)
        );
      },
    });
  }

  cols.push(
    {
      id: "branch",
      header: "Branch",
      accessorFn: (row) => row.branch?.name ?? "—",
    },
    {
      accessorKey: "paymentMode",
      header: "Mode",
      cell: ({ getValue }) => String(getValue() ?? "—"),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => formatPaymentType(row.original.type),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={row.original.status}
          tone={statusToneFromValue(row.original.status)}
        />
      ),
    }
  );

  return cols;
}

export { getPaymentId };
