import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  UserPlus,
  MessageSquarePlus,
  Bell,
  XCircle,
  Pencil,
} from "lucide-react";
import { enquiriesService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  enquirySourceLabel,
  enquiryPurposeLabel,
  enquiryStatusLabel,
  enquiryStatusTone,
  getEnquiryId,
  isEnquiryTerminal,
} from "@/lib/enquiry";
import { EnquiryTimeline } from "@/features/enquiries/EnquiryTimeline";
import { AddFollowUpDialog } from "@/features/enquiries/AddFollowUpDialog";
import { SetReminderDialog } from "@/features/enquiries/SetReminderDialog";
import { CloseEnquiryDialog } from "@/features/enquiries/CloseEnquiryDialog";
import { EditEnquiryDialog } from "@/features/enquiries/EditEnquiryDialog";
import type { EnquiryPrefillState } from "@/types/enquiry";

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export default function EnquiryDetailPage() {
  const { enquiryId = "" } = useParams();
  const navigate = useNavigate();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: enquiry, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.enquiries.detail(enquiryId),
    queryFn: () => enquiriesService.getById(enquiryId),
    enabled: Boolean(enquiryId),
  });

  const { data: timelineData } = useQuery({
    queryKey: queryKeys.enquiries.timeline(enquiryId),
    queryFn: () => enquiriesService.getTimeline(enquiryId),
    enabled: Boolean(enquiryId),
  });

  const { data: followUpsData } = useQuery({
    queryKey: queryKeys.enquiries.followUps(enquiryId),
    queryFn: () => enquiriesService.listFollowUps(enquiryId),
    enabled: Boolean(enquiryId),
  });

  const { data: remindersData } = useQuery({
    queryKey: queryKeys.enquiries.reminders(enquiryId),
    queryFn: () => enquiriesService.listReminders(enquiryId),
    enabled: Boolean(enquiryId),
  });

  const convertPrefill = useMemo<EnquiryPrefillState | null>(() => {
    if (!enquiry) return null;
    return {
      enquiryId: getEnquiryId(enquiry),
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
  }, [enquiry]);

  if (isLoading) return <LoadingState className="min-h-[40vh]" />;
  if (isError || !enquiry) {
    return <ErrorState title="Enquiry not found" onRetry={() => void refetch()} />;
  }

  const terminal = isEnquiryTerminal(enquiry.status);
  const followUps = followUpsData?.items ?? [];
  const reminders = remindersData?.items ?? [];
  const events = timelineData?.events ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/enquiries">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={enquiry.fullName}
        description={`${enquiry.enquiryCode} · ${enquiry.mobileNumber}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={enquiryStatusLabel(enquiry.status)}
              tone={enquiryStatusTone(enquiry.status)}
            />
            {!terminal && (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => setFollowUpOpen(true)}>
                  <MessageSquarePlus className="mr-1 h-4 w-4" />
                  Follow-up
                </Button>
                <Button variant="outline" size="sm" onClick={() => setReminderOpen(true)}>
                  <Bell className="mr-1 h-4 w-4" />
                  Reminder
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    navigate("/students/register", { state: { enquiryPrefill: convertPrefill } })
                  }
                >
                  <UserPlus className="mr-1 h-4 w-4" />
                  Convert to student
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCloseOpen(true)}>
                  <XCircle className="mr-1 h-4 w-4" />
                  Close
                </Button>
              </>
            )}
            {enquiry.status === "converted" && enquiry.studentId && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/students/${enquiry.studentId}`}>View student</Link>
              </Button>
            )}
          </div>
        }
      />

      <EditEnquiryDialog enquiry={enquiry} open={editOpen} onOpenChange={setEditOpen} />
      <AddFollowUpDialog enquiry={enquiry} open={followUpOpen} onOpenChange={setFollowUpOpen} />
      <SetReminderDialog enquiry={enquiry} open={reminderOpen} onOpenChange={setReminderOpen} />
      <CloseEnquiryDialog enquiry={enquiry} open={closeOpen} onOpenChange={setCloseOpen} />

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Full name" value={enquiry.fullName} />
            <DetailRow label="Age" value={enquiry.age != null ? String(enquiry.age) : null} />
            <DetailRow label="Gender" value={enquiry.gender?.replace(/_/g, " ")} />
            <DetailRow label="Occupation" value={enquiry.occupation} />
            <DetailRow label="College / School" value={enquiry.collegeSchool} />
            <DetailRow label="Counsellor" value={enquiry.counsellorName} />
          </div>
        </SectionCard>

        <SectionCard title="Contact details">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Mobile" value={enquiry.mobileNumber} />
            <DetailRow label="Alternate mobile" value={enquiry.alternateMobile} />
            <DetailRow label="Email" value={enquiry.email} />
            <DetailRow label="Address" value={enquiry.address} />
          </div>
        </SectionCard>

        <SectionCard title="Interest & plan">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Branch" value={enquiry.branch?.name} />
            <DetailRow label="Interested plan" value={enquiry.plan?.name} />
            <DetailRow label="Preferred shift" value={enquiry.preferredShift} />
            <DetailRow
              label="Expected joining"
              value={
                enquiry.expectedJoiningDate ? formatDate(enquiry.expectedJoiningDate) : null
              }
            />
            <DetailRow label="Source" value={enquirySourceLabel(enquiry.source)} />
            <DetailRow label="Purpose" value={enquiryPurposeLabel(enquiry.purpose)} />
            <DetailRow label="Budget" value={enquiry.budget} />
            <DetailRow
              label="Next follow-up"
              value={
                enquiry.nextFollowUpDate
                  ? `${formatDate(enquiry.nextFollowUpDate)}${enquiry.nextFollowUpTime ? ` ${enquiry.nextFollowUpTime}` : ""}`
                  : null
              }
            />
          </div>
        </SectionCard>

        <SectionCard title="Notes">
          <p className="text-sm whitespace-pre-wrap">{enquiry.remarks?.trim() || "No remarks recorded."}</p>
        </SectionCard>

        {(enquiry.convertedAt || enquiry.closedAt) && (
          <SectionCard title="Conversion details" className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {enquiry.convertedAt && (
                <>
                  <DetailRow label="Converted on" value={formatDate(enquiry.convertedAt)} />
                  <DetailRow label="Student" value={enquiry.student?.fullName ?? enquiry.student?.studentCode} />
                  <DetailRow label="Converted by" value={enquiry.convertedByUser?.fullName} />
                </>
              )}
              {enquiry.closedAt && (
                <>
                  <DetailRow label="Closed on" value={formatDate(enquiry.closedAt)} />
                  <DetailRow label="Closed by" value={enquiry.closedByUser?.fullName} />
                  <DetailRow label="Reason" value={enquiry.closeReason} />
                </>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      <div id="timeline">
        <SectionCard title="Timeline">
          <EnquiryTimeline events={events} />
        </SectionCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Follow-up history">
          {followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-ups yet.</p>
          ) : (
            <ul className="space-y-3">
              {followUps.map((f) => (
                <li key={f.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{formatDate(f.followUpDate)}</p>
                    {f.followUpTime && (
                      <span className="text-xs text-muted-foreground">{f.followUpTime}</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{f.remark}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Reminder history">
          {reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reminders scheduled.</p>
          ) : (
            <ul className="space-y-3">
              {reminders.map((r) => (
                <li key={r.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.title}</p>
                    <StatusBadge label={r.status} tone={r.status === "sent" ? "success" : "neutral"} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Due {formatDate(r.dueAt)}
                  </p>
                  {r.message && <p className="mt-1 text-sm">{r.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
