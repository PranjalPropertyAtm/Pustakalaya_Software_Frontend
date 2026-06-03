import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReceiptActions } from "@/components/receipts/ReceiptActions";
import type { Payment } from "@/types/domain";
import { getPaymentDate, getPaymentId } from "@/lib/payment";
import { getStudentId } from "@/lib/student";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

interface PaymentHistoryListProps {
  payments: Payment[];
  showStudent?: boolean;
  emptyMessage?: string;
}

function formatPaymentType(type?: string) {
  if (!type) return "—";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-3 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium sm:text-right break-all">{value}</span>
    </div>
  );
}

function PaymentDetails({
  payment,
  showStudent,
}: {
  payment: Payment;
  showStudent: boolean;
}) {
  const studentLinkId = payment.student?.id ?? payment.studentId;
  const date = getPaymentDate(payment);

  return (
    <div className="pt-3 mt-3 border-t border-border space-y-1">
      <DetailItem label="Branch" value={payment.branch?.name} />
      <DetailItem
        label="Amount"
        value={formatCurrency(payment.amount, payment.currency ?? DEFAULT_CURRENCY)}
      />
      <DetailItem label="Status" value={payment.status} />
      <DetailItem label="Type" value={formatPaymentType(payment.type)} />
      <DetailItem label="Mode" value={payment.paymentMode} />
      <DetailItem label="Reference" value={payment.paymentReference} />
      <DetailItem label="Paid on" value={date ? formatDate(date) : undefined} />
      {payment.createdAt && payment.createdAt !== date && (
        <DetailItem label="Recorded" value={formatDate(payment.createdAt)} />
      )}
      {payment.updatedAt && (
        <DetailItem label="Last updated" value={formatDate(payment.updatedAt)} />
      )}
      {showStudent && (
        <DetailItem
          label="Student"
          value={
            payment.student?.fullName ? (
              <Link
                to={`/students/${getStudentId({ id: studentLinkId, _id: studentLinkId })}`}
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {payment.student.fullName}
              </Link>
            ) : (
              studentLinkId
            )
          }
        />
      )}
      {payment.student?.studentCode && (
        <DetailItem label="Student code" value={payment.student.studentCode} />
      )}
      {payment.student?.mobileNumber && (
        <DetailItem label="Mobile" value={payment.student.mobileNumber} />
      )}
      {payment.notes && (
        <DetailItem
          label="Notes"
          value={<span className="whitespace-pre-wrap text-left sm:text-right">{payment.notes}</span>}
        />
      )}
      {payment.paymentProofUrl && (
        <DetailItem
          label="Payment proof"
          value={
            <Button variant="ghost" size="sm" className="h-auto p-0 sm:justify-end text-primary" asChild>
              <a
                href={payment.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                View file
                <ExternalLink className="h-3 w-3 ml-1 inline" />
              </a>
            </Button>
          }
        />
      )}
      {payment.receiptId && studentLinkId && (
        <DetailItem
          label="Receipt"
          value={
            <ReceiptActions
              compact
              studentId={String(studentLinkId)}
              receiptId={String(payment.receiptId)}
              className="sm:justify-end"
            />
          }
        />
      )}
    </div>
  );
}

export function PaymentHistoryList({
  payments,
  showStudent = true,
  emptyMessage = "No payments recorded yet.",
}: PaymentHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>;
  }

  const toggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="grid gap-3">
      {payments.map((p) => {
        const id = getPaymentId(p);
        const studentLinkId = p.student?.id ?? p.studentId;
        const date = getPaymentDate(p);
        const isExpanded = expandedId === id;

        return (
          <Card
            key={id}
            className={cn(
              "transition-shadow",
              isExpanded && "ring-2 ring-primary/20"
            )}
          >
            <CardContent className="p-0">
              <button
                type="button"
                onClick={() => toggle(id)}
                aria-expanded={isExpanded}
                className="flex w-full flex-col gap-2 p-4 text-left sm:flex-row sm:items-center sm:justify-between hover:bg-muted/40 transition-colors rounded-lg"
              >
                <div className="min-w-0 space-y-1 flex-1">
                  <p className="font-medium">{formatCurrency(p.amount, p.currency ?? DEFAULT_CURRENCY)}</p>
                  {showStudent && (p.student?.fullName || p.studentId) && (
                    <p className="text-sm">
                      {p.student?.fullName ? (
                        <Link
                          to={`/students/${getStudentId({ id: studentLinkId, _id: studentLinkId })}`}
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.student.fullName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Student</span>
                      )}
                      {p.student?.studentCode && (
                        <span className="text-muted-foreground"> · {p.student.studentCode}</span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {date ? formatDate(date) : "—"}
                    {p.branch?.name ? ` · ${p.branch.name}` : ""}
                    {p.paymentMode ? ` · ${p.paymentMode}` : ""}
                    {p.type ? ` · ${formatPaymentType(p.type)}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Badge variant={p.status === "completed" ? "success" : "warning"}>
                    {p.status}
                  </Badge>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4">
                  <PaymentDetails payment={p} showStudent={showStudent} />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
