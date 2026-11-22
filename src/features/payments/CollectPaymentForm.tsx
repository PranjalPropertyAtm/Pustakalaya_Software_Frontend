import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { paymentsService, renewalsService, studentsService } from "@/api/services";
import { useBranchContext } from "@/hooks/useBranchContext";
import { queryKeys } from "@/lib/queryKeys";
import { getRenewalId } from "@/lib/renewal";
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
import { formatParentContact, getStudentId } from "@/lib/student";
import { Link } from "react-router-dom";
import { Loader2, User, ArrowLeft } from "lucide-react";

function isDirectStudentLookup(value: string) {
  const trimmed = value.trim();
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) return true;
  return /^STU-[A-Z0-9]+-\d{4}-\d+$/i.test(trimmed);
}

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
  const { branchQuery } = useBranchContext();
  const [studentLookup, setStudentLookup] = useState("");
  const [debouncedLookup, setDebouncedLookup] = useState("");
  const [resolvedStudentId, setResolvedStudentId] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
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

  const directLookup = isDirectStudentLookup(debouncedLookup);
  const renewalIdForSummary = initialRenewalId?.trim() || renewalId || undefined;

  const { data: nameMatches, isFetching: namesFetching } = useQuery({
    queryKey: queryKeys.students.list({
      ...branchQuery,
      search: debouncedLookup,
      limit: 8,
      page: 1,
      scope: "collect-payment",
    }),
    queryFn: () =>
      studentsService.list({
        ...branchQuery,
        search: debouncedLookup,
        limit: 8,
        page: 1,
      }),
    enabled: debouncedLookup.length >= 2 && !directLookup,
    retry: false,
  });

  const {
    data: summary,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.payments.studentSummary(debouncedLookup, renewalIdForSummary),
    queryFn: () => paymentsService.getSummary(debouncedLookup, renewalIdForSummary),
    enabled: directLookup && debouncedLookup.length >= 3,
    retry: false,
  });

  const earlyPayment =
    summary?.suggestedAmount == null && summary?.earlyPayment?.amount
      ? summary.earlyPayment
      : null;
  const collectAmount = summary?.suggestedAmount ?? earlyPayment?.amount ?? null;
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
    mutationFn: async () => {
      if (collectAmount == null) {
        throw new Error("No payable amount for this student");
      }
      let renewalToCharge = renewalId;
      let amount = collectAmount;
      if (!renewalToCharge && earlyPayment) {
        const renewal = await renewalsService.initiate({ studentId: resolvedStudentId });
        renewalToCharge = getRenewalId(renewal);
        if (renewal.balanceDue != null && renewal.balanceDue > 0) {
          amount = renewal.balanceDue;
        } else if (renewal.expectedAmount != null) {
          amount = renewal.expectedAmount;
        }
      }
      const fd = new FormData();
      fd.append("studentId", resolvedStudentId);
      fd.append("amount", String(amount));
      fd.append("paymentMode", paymentMode);
      if (summary?.currency) fd.append("currency", summary.currency);
      const ref = reference.trim();
      if (ref) fd.append("paymentReference", ref);
      if (renewalToCharge) fd.append("renewalId", renewalToCharge);
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
      setPaymentMode("UPI");
      void queryClient.invalidateQueries({ queryKey: ["renewals"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["payments"], exact: false });
      onSuccess?.();
    },
    onError: (err) => {
      void queryClient.invalidateQueries({ queryKey: ["payments"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["renewals"], exact: false });
      toast.error(err instanceof ApiClientError ? err.message : "Payment failed");
    },
  });

  const lookupHint =
    debouncedLookup.length === 1
      ? "Type at least 2 characters to search"
      : undefined;
  const matches = nameMatches?.items ?? [];

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
          label="Student"
          required
          hint={lookupHint ?? "Search by name, mobile, or student code"}
        >
          <Input
            placeholder="Name, mobile, or student code"
            value={studentLookup}
            onChange={(e) => setStudentLookup(e.target.value)}
            onBlur={(e) => setStudentLookup(e.target.value.trim())}
          />
        </FormField>

        {!directLookup && debouncedLookup.length >= 2 && (
          <div className="rounded-lg border border-border divide-y">
            {namesFetching && (
              <p className="text-sm text-muted-foreground flex items-center gap-2 p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching students…
              </p>
            )}
            {!namesFetching && matches.length === 0 && (
              <p className="text-sm text-muted-foreground p-3">No student found with that name.</p>
            )}
            {matches.map((student) => {
              const id = getStudentId(student);
              return (
                <button
                  key={id}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/60"
                  onClick={() => {
                    const code = student.studentCode || id;
                    setStudentLookup(code);
                    setDebouncedLookup(code);
                  }}
                >
                  <span>
                    <span className="font-medium">{student.fullName}</span>
                    <span className="block text-muted-foreground">
                      {student.studentCode}
                      {student.mobileNumber ? ` · ${student.mobileNumber}` : ""}
                      {student.branch?.name ? ` · ${student.branch.name}` : ""}
                    </span>
                  </span>
                  <Badge variant={student.status === "active" ? "success" : "outline"}>
                    {student.status}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}

        {isFetching && directLookup && debouncedLookup.length >= 3 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading student details…
          </p>
        )}

        {isError && directLookup && debouncedLookup.length >= 3 && (
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
            {earlyPayment && (
              <div className="space-y-1 pt-1 border-t border-border/60">
                <p className="text-sm font-medium text-primary">
                  Next term fee: {formatCurrency(earlyPayment.amount, earlyPayment.currency || summary.currency)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Current membership is not due yet. This full fee is for the next term
                  {earlyPayment.newStartDate ? `, starting ${formatDate(earlyPayment.newStartDate)}` : ""}
                  {earlyPayment.newEndDate ? ` until ${formatDate(earlyPayment.newEndDate)}` : ""}.
                </p>
              </div>
            )}
            {summary.suggestedAmount == null && !earlyPayment && (
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
                ? earlyPayment
                  ? "Full fee for the next term"
                  : (summary.suggestedAmountLabel ?? "Fixed amount based on pending renewal or registration fee")
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
