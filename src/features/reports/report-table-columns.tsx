import type { ColumnDef } from "@tanstack/react-table";
import type {
  BranchComparisonRow,
  ExpiringStudentRow,
  PlanDistributionItem,
  PlanWiseRow,
  ShiftWiseRow,
} from "@/types/reports";
import { formatDate } from "@/lib/utils";

export function getRenewalsDueColumns(): ColumnDef<ExpiringStudentRow>[] {
  return [
    {
      accessorKey: "endDate",
      header: "End date",
      cell: ({ row }) =>
        row.original.endDate ? formatDate(row.original.endDate) : "—",
    },
    {
      accessorKey: "fullName",
      header: "Student",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.fullName}</p>
          {row.original.studentCode && (
            <p className="text-xs text-muted-foreground">{row.original.studentCode}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "mobileNumber",
      header: "Mobile",
    },
    {
      accessorKey: "plan",
      header: "Plan",
    },
  ];
}

export function getBranchComparisonColumns(): ColumnDef<BranchComparisonRow>[] {
  return [
    {
      accessorKey: "branchName",
      header: "Branch",
    },
    {
      accessorKey: "activeStudents",
      header: "Active",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.activeStudents}</span>
      ),
    },
    {
      accessorKey: "expiredStudents",
      header: "Expired",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.expiredStudents}</span>
      ),
    },
    {
      accessorKey: "occupancyPercent",
      header: "Occupancy",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.occupancyPercent}%</span>
      ),
    },
    {
      accessorKey: "totalSeats",
      header: "Seats",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.totalSeats}</span>
      ),
    },
  ];
}

export function getPlanDistributionColumns(): ColumnDef<PlanDistributionItem>[] {
  return [
    {
      accessorKey: "planName",
      header: "Plan",
    },
    {
      accessorKey: "studentCount",
      header: "Students",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.studentCount}</span>
      ),
    },
    {
      accessorKey: "sharePercent",
      header: "Share",
      cell: ({ row }) => (
        <span className="tabular-nums">
          {row.original.sharePercent != null ? `${row.original.sharePercent}%` : "—"}
        </span>
      ),
    },
    {
      accessorKey: "durationHours",
      header: "Duration",
      cell: ({ row }) =>
        row.original.durationHours != null ? `${row.original.durationHours}hr` : "—",
    },
  ];
}

export function getPlanWiseColumns(): ColumnDef<PlanWiseRow>[] {
  return [
    { accessorKey: "planName", header: "Plan" },
    {
      accessorKey: "activeStudents",
      header: "Active students",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.activeStudents}</span>
      ),
    },
    {
      accessorKey: "occupancyPercent",
      header: "Occupancy",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.occupancyPercent}%</span>
      ),
    },
  ];
}

export function getShiftWiseColumns(): ColumnDef<ShiftWiseRow>[] {
  return [
    {
      accessorKey: "shiftCode",
      header: "Shift",
      cell: ({ row }) =>
        row.original.shiftCode === "—" ? "No shift" : row.original.shiftCode,
    },
    {
      accessorKey: "activeStudents",
      header: "Active students",
      cell: ({ row }) => (
        <span className="tabular-nums">{row.original.activeStudents}</span>
      ),
    },
  ];
}
