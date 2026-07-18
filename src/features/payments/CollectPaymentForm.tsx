import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { FileUploadField } from "@/components/forms/FileUploadField";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ApiClientError } from "@/api/client";
import { typography } from "@/lib/typography";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatParentContact } from "@/lib/student";
import { Link } from "react-router-dom";
import { Loader2, User, ArrowLeft } from "lucide-react";

interface CollectPaymentFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
  backTo?: string;
  initialStudentLookup?: string;
  initialRenewalId?: string;
}

export function CollectPaymentForm({
  onSuccess,
  onBack,
  backTo,
  initialStudentLookup,
  initialRenewalId,
}: CollectPaymentFormProps) {
  const queryClient = useQueryClient();
  const [studentLookup, setStudentLookup] = useState("");
  const [debouncedLookup, setDebouncedLookup] = useState("");
  const [resolvedStudentId, setResolvedStudentId] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [reference, setReference] = useState("");
  const [proof, setProof] = useState<File | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [renewalId, setRenewalId] = useState("");

  useEffect(() => {
    const lookup = initialStudentLookup?.trim();
    if (!lookup) return;
    setStudentLookup(lookup);
    // Skip debounce so form is prefilled instantly when coming from Renewals.
    setDebouncedLookup(lookup);
    if (initialRenewalId?.trim()) {
      setRenewalId(initialRenewalId.trim());
    }
    // Only run on first mount / param change.
  }, [initialStudentLookup, initialRenewalId]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedLookup(studentLookup.trim()), 400);
    return () => clearTimeout(timer);
  }, [studentLookup]);

  useEffect(() => {
    if (!debouncedLookup) {
      setResolvedStudentId("");
      setRenewalId("");
    }
  }, [debouncedLookup]);

  const renewalIdForSummary = initialRenewalId?.trim() || renewalId || undefined;

  const {
    data: summary,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.payments.studentSummary(debouncedLookup, renewalIdForSummary),
    queryFn: () => paymentsService.getSummary(debouncedLookup, renewalIdForSummary),
    enabled: debouncedLookup.length >= 3,
    retry: false,
  });

  const collectAmount = summary?.suggestedAmount ?? null;
  const canCollect = Boolean(resolvedStudentId && collectAmount != null && collectAmount > 0);

  useEffect(() => {
    if (!summary) {
      setResolvedStudentId("");
      return;
    }
    setResolvedStudentId(summary.studentId);
    if (initialRenewalId?.trim()) {
      setRenewalId(initialRenewalId.trim());
      return;
    }
    if (summary.activeRenewal?.id) setRenewalId(summary.activeRenewal.id);
    else setRenewalId("");
  }, [summary, initialRenewalId]);

  const mutation = useMutation({
    mutationFn: () => {
      if (collectAmount == null) {
        throw new Error("No payable amount for this student");
      }
      const fd = new FormData();
      fd.append("studentId", resolvedStudentId);
      fd.append("amount", String(collectAmount));
      fd.append("paymentMode", paymentMode);
      if (summary?.currency) fd.append("currency", summary.currency);
      const ref = reference.trim();
      if (ref) fd.append("paymentReference", ref);
      if (renewalId) fd.append("renewalId", renewalId);
      if (proof) fd.append("paymentProof", proof);
      return paymentsService.collect(fd);
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      setStudentLookup("");
      setDebouncedLookup("");
      setResolvedStudentId("");
      setRenewalId("");
      setProof(null);
      setProofError(null);
      void queryClient.invalidateQueries({ queryKey: ["renewals"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["payments"], exact: false });
      onSuccess?.();
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Payment failed"),
  });

  const lookupHint =
    debouncedLookup.length > 0 && debouncedLookup.length < 3
      ? "Type at least 3 characters to search"
      : undefined;

  return (
    <div className="max-w-lg space-y-3">
      {(backTo || onBack) && (
        backTo ? (
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to={backTo}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )
      )}
      <Card>
      <CardHeader>
        <CardTitle className="text-base">Collect payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          label="Student ID / code"
          required
          hint={lookupHint ?? "e.g. STU-ABCD-2026-00001 or database ID"}
        >
          <Input
            placeholder="Student code or ID"
            value={studentLookup}
            onChange={(e) => setStudentLookup(e.target.value)}
            onBlur={(e) => setStudentLookup(e.target.value.trim())}
          />
        </FormField>

        {isFetching && debouncedLookup.length >= 3 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading student details…
          </p>
        )}

        {isError && debouncedLookup.length >= 3 && (
          <p className="text-sm text-destructive">
            {error instanceof ApiClientError ? error.message : "Student not found"}
          </p>
        )}

        {summary && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={typography.subsectionTitle}>{summary.student.fullName}</p>
                <p className={typography.muted}>{summary.student.studentCode}</p>
              </div>
              <Badge variant={summary.student.status === "active" ? "success" : "outline"}>
                {summary.student.status}
              </Badge>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              <p>
                <span className="text-muted-foreground">Mobile: </span>
                {summary.student.mobileNumber}
              </p>
              {summary.student.parentContact && (
                <p>
                  <span className="text-muted-foreground">Alternate contact: </span>
                  {formatParentContact(summary.student)}
                </p>
              )}
              {summary.student.plan?.name && (
                <p>
                  <span className="text-muted-foreground">Plan: </span>
                  {summary.student.plan.name}
                </p>
              )}
              {summary.student.seat?.seatNumber && (
                <p>
                  <span className="text-muted-foreground">Seat: </span>
                  {summary.student.seat.seatNumber}
                </p>
              )}
              {summary.student.endDate && (
                <p className="sm:col-span-2">
                  <span className="text-muted-foreground">Membership ends: </span>
                  {formatDate(summary.student.endDate)}
                </p>
              )}
            </div>
            {summary.suggestedAmount != null && summary.suggestedAmount > 0 && (
              <p className="text-sm font-medium text-primary pt-1 border-t border-border/60">
                {summary.suggestedAmountLabel ?? "Amount due"}:{" "}
                {formatCurrency(summary.suggestedAmount, summary.currency)}
              </p>
            )}
            {summary.suggestedAmount == null && (
              <p className="text-sm text-muted-foreground pt-1 border-t border-border/60">
                No payment is due for this student.
              </p>
            )}
            {summary.activeRenewal && (
              <p className="text-xs text-muted-foreground">
                Renewal {summary.activeRenewal.renewalNumber} · paid{" "}
                {formatCurrency(summary.activeRenewal.amountPaid, summary.currency)} of{" "}
                {formatCurrency(summary.activeRenewal.expectedAmount, summary.currency)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Total paid so far: {formatCurrency(summary.totalPaid, summary.currency)} (
              {summary.paymentCount} payments)
            </p>
          </div>
        )}

        {summary && (
          <FormField
            label="Amount"
            required
            hint={
              canCollect
                ? (summary.suggestedAmountLabel ?? "Fixed amount based on pending renewal or registration fee")
                : "Payment can only be recorded when an amount is due"
            }
          >
            <Input
              type="text"
              readOnly
              disabled
              value={
                collectAmount != null && collectAmount > 0
                  ? formatCurrency(collectAmount, summary.currency)
                  : "—"
              }
              className="bg-muted/50"
            />
          </FormField>
        )}
        <FormField label="Payment mode" required>
          <Select value={paymentMode} onValueChange={setPaymentMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField label="Reference">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
        </FormField>
        <FileUploadField
          label="Payment screenshot"
          value={proof}
          onChange={(file) => {
            setProof(file);
            if (file) setProofError(null);
          }}
          accept="image/*"
          error={proofError ?? undefined}
        />
        <Button
          onClick={() => {
            if (!proof) {
              setProofError("Payment screenshot is required");
              toast.error("Payment screenshot is required");
              return;
            }
            mutation.mutate();
          }}
          disabled={!canCollect || !proof || mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Record payment"}
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}
