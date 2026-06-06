import { LazyImage } from "@/components/common/LazyImage";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Mail,
  MapPin,
  Phone,
  User,
  Armchair,
  CreditCard,
  FileText,
  ExternalLink,
  IndianRupee,
} from "lucide-react";
import { studentsService, paymentsService, receiptsService } from "@/api/services";
import { ReceiptActions } from "@/components/receipts/ReceiptActions";
import { queryKeys } from "@/lib/queryKeys";
import { formatPlanSchedule } from "@/lib/plan";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PaymentHistoryList } from "@/components/payments/PaymentHistoryList";
import { ChangeStudentSeatDialog } from "@/features/students/ChangeStudentSeatDialog";
import { EditStudentDialog } from "@/features/students/EditStudentDialog";

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 py-2 border-b border-border/60 last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right sm:text-left break-words">{value}</span>
    </div>
  );
}

export default function StudentDetailPage() {
  const { studentId = "" } = useParams();

  const {
    data: student,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.students.detail(studentId),
    queryFn: () => studentsService.getById(studentId),
    enabled: Boolean(studentId),
  });

  const { data: registrationsData } = useQuery({
    queryKey: queryKeys.students.registrations(studentId),
    queryFn: () => studentsService.listRegistrations(studentId, { limit: 10 }),
    enabled: Boolean(studentId),
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: queryKeys.payments.list({ studentId, limit: 50 }),
    queryFn: () => paymentsService.list({ studentId, limit: 50 }),
    enabled: Boolean(studentId),
  });

  const { data: receiptsData, isLoading: receiptsLoading } = useQuery({
    queryKey: queryKeys.receipts.list({ studentId, limit: 20 }),
    queryFn: () => receiptsService.list({ studentId, limit: 20 }),
    enabled: Boolean(studentId),
  });

  if (!studentId) {
    return <ErrorState message="Invalid student" />;
  }

  if (isLoading) return <LoadingState className="min-h-[40vh]" />;
  if (isError || !student) {
    return <ErrorState onRetry={refetch} message="Could not load student details" />;
  }

  const schedule = formatPlanSchedule(
    student.plan ?? undefined,
    student.currentShiftCode,
    student.preferredStartTime,
    student.preferredEndTime
  );

  const registrations = registrationsData?.items ?? [];
  const payments = paymentsData?.items ?? [];
  const receipts = receiptsData?.items ?? [];
  const paidReceiptIds = new Set(receipts.map((receipt) => String(receipt.id)));

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/students">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>

      <PageHeader
        title={student.fullName}
        description={student.studentCode ? `Code: ${student.studentCode}` : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EditStudentDialog student={student} onSuccess={refetch} />
            <Badge
              variant={
                student.status === "active"
                  ? "success"
                  : student.status === "inactive" || student.status === "expired"
                    ? "warning"
                    : "outline"
              }
              className="text-sm"
            >
              {student.status === "inactive" || student.status === "expired"
                ? "Inactive (renewal due)"
                : student.status}
            </Badge>
          </div>
        }
      />

      {student.photoUrl && (
        <Card>
          <CardContent className="pt-6 flex justify-center sm:justify-start">
            <LazyImage
              src={student.photoUrl}
              alt={student.fullName}
              width={128}
              height={128}
              className="h-32 w-32 rounded-lg object-cover border border-border"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Mobile" value={student.mobileNumber} />
            <DetailRow label="Parent contact" value={student.parentContact} />
            <DetailRow label="Email" value={student.email} />
            <DetailRow
              label="Address"
              value={
                student.address ? (
                  <span className="flex items-start gap-1 justify-end sm:justify-start">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {student.address}
                  </span>
                ) : undefined
              }
            />
            {student.notes && (
              <DetailRow label="Notes" value={<span className="whitespace-pre-wrap">{student.notes}</span>} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Armchair className="h-4 w-4" />
              Plan & seat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Branch" value={student.branch?.name} />
            <DetailRow label="Plan" value={student.plan?.name} />
            <DetailRow label="Seat" value={student.seat ? `Seat ${student.seat.seatNumber}` : undefined} />
            <ChangeStudentSeatDialog student={student} onSuccess={refetch} />
            {(student.status === "inactive" || student.status === "expired") && (
              <p className="text-xs text-muted-foreground pt-1">
                Renew membership before changing seat.
              </p>
            )}
            <DetailRow label="Schedule" value={schedule || undefined} />
            <DetailRow label="Joining" value={student.joiningDate ? formatDate(student.joiningDate) : undefined} />
            <DetailRow label="Start" value={student.startDate ? formatDate(student.startDate) : undefined} />
            <DetailRow label="Ends" value={student.endDate ? formatDate(student.endDate) : undefined} />
          </CardContent>
        </Card>
      </div>

      {(student.idProofUrl || student.photoUrl) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {student.photoUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={student.photoUrl} target="_blank" rel="noopener noreferrer">
                  Photo <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            {student.idProofUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={student.idProofUrl} target="_blank" rel="noopener noreferrer">
                  ID proof <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Receipts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {receiptsLoading ? (
            <LoadingState />
          ) : receipts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Receipts appear here after registration or renewal payment is recorded.
            </p>
          ) : (
            receipts.map((r) => (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="text-sm">
                  <p className="font-medium">{r.receiptNumber}</p>
                  <p className="text-muted-foreground">
                    {r.issuedAt ? formatDate(r.issuedAt) : "—"}
                    {r.totalAmount != null
                      ? ` · ${formatCurrency(r.totalAmount, r.currency ?? DEFAULT_CURRENCY)}`
                      : ""}
                  </p>
                </div>
                <ReceiptActions
                  studentId={studentId}
                  receiptId={r.id}
                  receiptNumber={r.receiptNumber}
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <IndianRupee className="h-4 w-4" />
            Payment history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <LoadingState />
          ) : (
            <PaymentHistoryList
              payments={payments}
              showStudent={false}
              emptyMessage="No payments recorded for this student yet."
            />
          )}
        </CardContent>
      </Card>

      {registrations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Registration history
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="rounded-lg border border-border p-3 text-sm space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {reg.paymentAmount != null
                      ? formatCurrency(reg.paymentAmount, reg.currency ?? DEFAULT_CURRENCY)
                      : "—"}
                  </span>
                  <Badge variant="outline">{reg.status ?? "—"}</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {reg.startDate && reg.endDate
                    ? `${formatDate(reg.startDate)} – ${formatDate(reg.endDate)}`
                    : "—"}
                  {reg.durationMonths ? ` · ${reg.durationMonths} mo` : ""}
                </p>
                {reg.paymentMethod && (
                  <p className="text-muted-foreground">
                    {reg.paymentMethod}
                    {reg.paymentReference ? ` · Ref: ${reg.paymentReference}` : ""}
                  </p>
                )}
                {reg.receiptId && paidReceiptIds.has(String(reg.receiptId)) && (
                  <ReceiptActions
                    studentId={studentId}
                    receiptId={String(reg.receiptId)}
                    className="mt-2"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-4">
        {student.createdAt && <span>Registered {formatDate(student.createdAt)}</span>}
        <span className="flex items-center gap-1">
          <Phone className="h-3 w-3" />
          {student.mobileNumber}
        </span>
        {student.email && (
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {student.email}
          </span>
        )}
      </p>
    </div>
  );
}
