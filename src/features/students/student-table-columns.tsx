import { memo, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  RefreshCw,
  Armchair,
  FileText,
  CreditCard,
  Trash2,
} from "lucide-react";
import type { Student } from "@/types/domain";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { RowActionMenu } from "@/components/data-table";
import { typography } from "@/lib/typography";
import { cn, formatDate } from "@/lib/utils";
import { getStudentId, getStudentSeatLabel } from "@/lib/student";
import { optimizeImageUrl } from "@/lib/image";
import { toast } from "sonner";
import { EditStudentDialog } from "@/features/students/EditStudentDialog";

function paymentStatusLabel(student: Student) {
  const s = student.status?.toLowerCase();
  if (s === "active") return "Current";
  if (s === "inactive" || s === "expired") return "Due";
  if (s === "pending") return "Pending";
  return "—";
}

function paymentStatusTone(student: Student) {
  const label = paymentStatusLabel(student);
  if (label === "Current") return "success" as const;
  if (label === "Due") return "warning" as const;
  return "neutral" as const;
}

function statusLabel(status: string) {
  if (status === "inactive" || status === "expired") return "Renewal due";
  return status;
}

const StudentPhotoCell = memo(function StudentPhotoCell({ student }: { student: Student }) {
  const initials = student.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const photoSrc = optimizeImageUrl(student.photoUrl, { width: 72, height: 72 });

  return (
    <Avatar className="h-9 w-9 ring-2 ring-background">
      {photoSrc && (
        <AvatarImage src={photoSrc} alt={student.fullName} loading="lazy" width={36} height={36} />
      )}
      <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
    </Avatar>
  );
});

const StudentActionsCell = memo(function StudentActionsCell({ student }: { student: Student }) {
  const navigate = useNavigate();
  const id = getStudentId(student);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <EditStudentDialog student={student} open={editOpen} onOpenChange={setEditOpen} />
      <RowActionMenu
        actions={[
          {
            label: "View profile",
            icon: <Eye className="mr-2 h-4 w-4" />,
            onClick: () => navigate(`/students/${id}`),
          },
          {
            label: "Edit",
            icon: <Pencil className="mr-2 h-4 w-4" />,
            onClick: () => setEditOpen(true),
          },
          {
            label: "Renew",
            icon: <RefreshCw className="mr-2 h-4 w-4" />,
            onClick: () => navigate("/renewals"),
            disabled: student.status === "active",
          },
          {
            label: "Change seat",
            icon: <Armchair className="mr-2 h-4 w-4" />,
            onClick: () => navigate(`/students/${id}`),
            disabled: student.status !== "active",
          },
          {
            label: "View documents",
            icon: <FileText className="mr-2 h-4 w-4" />,
            onClick: () => navigate(`/students/${id}#documents`),
          },
          {
            label: "Payment history",
            icon: <CreditCard className="mr-2 h-4 w-4" />,
            onClick: () =>
              navigate(`/payments?tab=list&studentId=${encodeURIComponent(id)}`),
            separatorBefore: true,
          },
          {
            label: "Delete",
            icon: <Trash2 className="mr-2 h-4 w-4" />,
            destructive: true,
            disabled: true,
            onClick: () =>
              toast.info("Student deletion is not enabled in this release."),
          },
        ]}
      />
    </div>
  );
});

export function useStudentColumns(): ColumnDef<Student>[] {
  return useMemo(
    () => [
    {
      id: "photo",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => <StudentPhotoCell student={row.original} />,
      size: 48,
    },
    {
      accessorKey: "studentCode",
      header: "Student ID",
      cell: ({ row }) => (
        <span className={typography.monoCode}>
          {row.original.studentCode ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => {
        const s = row.original;
        const id = getStudentId(s);
        return (
          <Link
            to={`/students/${id}`}
            className={cn(typography.bodyMedium, "hover:text-primary transition-colors")}
            onClick={(e) => e.stopPropagation()}
          >
            {s.fullName}
          </Link>
        );
      },
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile",
      cell: ({ getValue }) => <span className="tabular-nums">{String(getValue() ?? "—")}</span>,
    },
    {
      id: "branch",
      header: "Branch",
      accessorFn: (row) => row.branch?.name ?? "—",
    },
    {
      id: "plan",
      header: "Plan",
      accessorFn: (row) => row.plan?.name ?? "—",
      cell: ({ getValue }) => <span className="capitalize">{String(getValue())}</span>,
    },
    {
      id: "shift",
      header: "Shift",
      accessorFn: (row) => row.currentShiftCode ?? "—",
      cell: ({ getValue }) => {
        const v = getValue();
        return v && v !== "—" ? `Shift ${v}` : "—";
      },
    },
    {
      id: "seat",
      header: "Seat no.",
      accessorFn: (row) => getStudentSeatLabel(row) ?? "",
      cell: ({ row }) => {
        const label = getStudentSeatLabel(row.original);
        if (!label) return <span className="text-muted-foreground">—</span>;
        return <span className="font-medium tabular-nums">{label}</span>;
      },
    },
    {
      accessorKey: "startDate",
      header: "Start",
      cell: ({ getValue }) => {
        const v = getValue() as string | undefined;
        return v ? formatDate(v) : "—";
      },
    },
    {
      accessorKey: "endDate",
      header: "End",
      cell: ({ row }) => {
        const v = row.original.endDate;
        const lapsed =
          row.original.status === "inactive" || row.original.status === "expired";
        return v ? (
          <span className={lapsed ? "text-amber-700 dark:text-amber-400 font-medium" : ""}>
            {formatDate(v)}
          </span>
        ) : (
          "—"
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          label={statusLabel(row.original.status)}
          tone={statusToneFromValue(row.original.status)}
        />
      ),
    },
    {
      id: "paymentStatus",
      header: "Payment",
      enableSorting: false,
      cell: ({ row }) => (
        <StatusBadge
          label={paymentStatusLabel(row.original)}
          tone={paymentStatusTone(row.original)}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => <StudentActionsCell student={row.original} />,
    },
  ],
    []
  );
}
