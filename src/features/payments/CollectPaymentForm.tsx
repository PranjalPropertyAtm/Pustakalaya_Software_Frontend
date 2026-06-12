import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Loader2, User } from "lucide-react";

interface CollectPaymentFormProps {
  onSuccess?: () => void;
  initialStudentLookup?: string;
  initialRenewalId?: string;
}

export function CollectPaymentForm({
  onSuccess,
  initialStudentLookup,
  initialRenewalId,
}: CollectPaymentFormProps) {
  const [studentLookup, setStudentLookup] = useState("");
  const [debouncedLookup, setDebouncedLookup] = useState("");
  const [resolvedStudentId, setResolvedStudentId] = useState("");
  const [amount, setAmount] = useState("");
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
      setAmount("");
      setRenewalId("");
    }
  }, [debouncedLookup]);

  const {
    data: summary,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.payments.studentSummary(debouncedLookup),
    queryFn: () => paymentsService.getSummary(debouncedLookup),
    enabled: debouncedLookup.length >= 3,
    retry: false,
  });

  useEffect(() => {
    if (!summary) {
      setResolvedStudentId("");
      return;
    }
    setResolvedStudentId(summary.studentId);
    if (summary.suggestedAmount != null && summary.suggestedAmount > 0) {
      setAmount(String(summary.suggestedAmount));
    }
    if (initialRenewalId?.trim()) {
      setRenewalId(initialRenewalId.trim());
      return;
    }
    if (summary.activeRenewal?.id) setRenewalId(summary.activeRenewal.id);
    else setRenewalId("");
  }, [summary]);

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("studentId", resolvedStudentId);
      fd.append("amount", amount);
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
      setAmount("");
      setRenewalId("");
      setProof(null);
      setProofError(null);
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
    <Card className="max-w-lg">
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
                {summary.suggestedAmountLabel ?? "Suggested amount"}:{" "}
                {formatCurrency(summary.suggestedAmount, summary.currency)}
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

        <FormField label="Amount" required>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </FormField>
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
          disabled={!resolvedStudentId || !amount || !proof || mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Record payment"}
        </Button>
      </CardContent>
    </Card>
  );
}
