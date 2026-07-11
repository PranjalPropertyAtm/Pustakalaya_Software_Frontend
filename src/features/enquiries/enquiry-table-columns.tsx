import { memo, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Pencil,
  MessageSquarePlus,
  History,
  Bell,
  UserPlus,
  XCircle,
  Trash2,
} from "lucide-react";
import type { Enquiry } from "@/types/enquiry";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { RowActionMenu } from "@/components/data-table";
import { typography } from "@/lib/typography";
import { cn, formatDate } from "@/lib/utils";
import {
  getEnquiryId,
  enquirySourceLabel,
  enquiryStatusLabel,
  enquiryStatusTone,
  isEnquiryTerminal,
} from "@/lib/enquiry";
import { EditEnquiryDialog } from "@/features/enquiries/EditEnquiryDialog";
import { AddFollowUpDialog } from "@/features/enquiries/AddFollowUpDialog";
import { SetReminderDialog } from "@/features/enquiries/SetReminderDialog";
import { CloseEnquiryDialog } from "@/features/enquiries/CloseEnquiryDialog";
import { DeleteEnquiryDialog } from "@/features/enquiries/DeleteEnquiryDialog";
import { useAuthStore } from "@/stores/authStore";
import { ROLES } from "@/lib/constants";
import type { EnquiryPrefillState } from "@/types/enquiry";

const EnquiryActionsCell = memo(function EnquiryActionsCell({ enquiry }: { enquiry: Enquiry }) {
  const navigate = useNavigate();
  const id = getEnquiryId(enquiry);
  const isSuperAdmin = useAuthStore((s) => s.user?.role === ROLES.SUPER_ADMIN);
  const terminal = isEnquiryTerminal(enquiry.status);

  const [editOpen, setEditOpen] = useState(false);
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const convertPrefill: EnquiryPrefillState = {
    enquiryId: id,
    fullName: enquiry.fullName,
    mobileNumber: enquiry.mobileNumber,
    address: enquiry.address,
    branchId: enquiry.branchId,
    planId: enquiry.interestedPlanId ?? undefined,
    shiftCode: enquiry.preferredShift ?? undefined,
    notes: enquiry.remarks,
    email: enquiry.email,
    expectedJoiningDate: enquiry.expectedJoiningDate
      ? new Date(enquiry.expectedJoiningDate).toISOString().slice(0, 10)
      : undefined,
  };

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <EditEnquiryDialog enquiry={enquiry} open={editOpen} onOpenChange={setEditOpen} />
      <AddFollowUpDialog enquiry={enquiry} open={followUpOpen} onOpenChange={setFollowUpOpen} />
      <SetReminderDialog enquiry={enquiry} open={reminderOpen} onOpenChange={setReminderOpen} />
      <CloseEnquiryDialog enquiry={enquiry} open={closeOpen} onOpenChange={setCloseOpen} />
      {isSuperAdmin && (
        <DeleteEnquiryDialog enquiry={enquiry} open={deleteOpen} onOpenChange={setDeleteOpen} />
      )}
      <RowActionMenu
        actions={[
          {
            label: "View",
            icon: <Eye className="mr-2 h-4 w-4" />,
            onClick: () => navigate(`/enquiries/${id}`),
          },
          ...(!terminal
            ? [
                {
                  label: "Edit",
                  icon: <Pencil className="mr-2 h-4 w-4" />,
                  onClick: () => setEditOpen(true),
                },
                {
                  label: "Add follow-up",
                  icon: <MessageSquarePlus className="mr-2 h-4 w-4" />,
                  onClick: () => setFollowUpOpen(true),
                },
              ]
            : []),
          {
            label: "View timeline",
            icon: <History className="mr-2 h-4 w-4" />,
            onClick: () => navigate(`/enquiries/${id}#timeline`),
          },
          ...(!terminal
            ? [
                {
                  label: "Set reminder",
                  icon: <Bell className="mr-2 h-4 w-4" />,
                  onClick: () => setReminderOpen(true),
                },
                {
                  label: "Convert to student",
                  icon: <UserPlus className="mr-2 h-4 w-4" />,
                  onClick: () =>
                    navigate("/students/register", { state: { enquiryPrefill: convertPrefill } }),
                },
                {
                  label: "Close enquiry",
                  icon: <XCircle className="mr-2 h-4 w-4" />,
                  onClick: () => setCloseOpen(true),
                  separatorBefore: true,
                },
              ]
            : []),
          ...(isSuperAdmin
            ? [
                {
                  label: "Delete",
                  icon: <Trash2 className="mr-2 h-4 w-4" />,
                  onClick: () => setDeleteOpen(true),
                  destructive: true,
                },
              ]
            : []),
        ]}
      />
    </div>
  );
});

export function useEnquiryColumns(): ColumnDef<Enquiry>[] {
  return useMemo(
    () => [
      {
        accessorKey: "enquiryCode",
        header: "Enquiry ID",
        cell: ({ row }) => (
          <span className={cn(typography.tableCell, "font-mono text-xs")}>
            {row.original.enquiryCode}
          </span>
        ),
      },
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className={typography.bodyMedium}>{row.original.fullName}</p>
            <p className={typography.tableCellMuted}>{row.original.mobileNumber}</p>
          </div>
        ),
      },
      {
        id: "phone",
        accessorKey: "mobileNumber",
        header: "Phone",
        meta: { hideByDefault: true },
      },
      {
        id: "branch",
        header: "Branch",
        cell: ({ row }) => row.original.branch?.name ?? "—",
      },
      {
        id: "plan",
        header: "Interested Plan",
        cell: ({ row }) => row.original.plan?.name ?? "—",
      },
      {
        accessorKey: "preferredShift",
        header: "Shift",
        cell: ({ row }) => row.original.preferredShift ?? "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <StatusBadge
            label={enquiryStatusLabel(row.original.status)}
            tone={enquiryStatusTone(row.original.status)}
          />
        ),
      },
      {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => (
          <span className="capitalize">{enquirySourceLabel(row.original.source)}</span>
        ),
      },
      {
        accessorKey: "expectedJoiningDate",
        header: "Expected Joining",
        cell: ({ row }) =>
          row.original.expectedJoiningDate
            ? formatDate(row.original.expectedJoiningDate)
            : "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (row.original.createdAt ? formatDate(row.original.createdAt) : "—"),
      },
      {
        accessorKey: "counsellorName",
        header: "Counsellor",
        cell: ({ row }) => row.original.counsellorName ?? "—",
      },
      {
        id: "nextFollowUp",
        header: "Next Follow-up",
        cell: ({ row }) => {
          const date = row.original.nextFollowUpDate;
          if (!date) return "—";
          const time = row.original.nextFollowUpTime;
          return (
            <span>
              {formatDate(date)}
              {time ? ` ${time}` : ""}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => <EnquiryActionsCell enquiry={row.original} />,
      },
    ],
    []
  );
}
