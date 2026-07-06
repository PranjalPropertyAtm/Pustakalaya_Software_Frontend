import type { StudentRenewalSummary } from "@/types/domain";

export function studentRenewalLabel(
  renewal?: StudentRenewalSummary | null
): "Payment pending" | "Renewed" | "First term" | "—" {
  if (!renewal) return "—";
  if (renewal.state === "pending" || renewal.state === "partial") return "Payment pending";
  if (renewal.hasRenewed) return "Renewed";
  return "First term";
}

export function studentRenewalTone(
  renewal?: StudentRenewalSummary | null
): "success" | "warning" | "neutral" | "outline" {
  const label = studentRenewalLabel(renewal);
  if (label === "Renewed") return "success";
  if (label === "Payment pending") return "warning";
  if (label === "First term") return "outline";
  return "neutral";
}

export function studentRenewalDisplay(renewal?: StudentRenewalSummary | null): {
  label: string;
  tone: "success" | "warning" | "neutral" | "outline";
  detail?: string;
} {
  const label = studentRenewalLabel(renewal);
  const tone = studentRenewalTone(renewal);

  if (label === "Payment pending" && renewal?.renewalNumber) {
    return { label, tone, detail: renewal.renewalNumber };
  }

  return { label, tone };
}

export function studentRenewalExportValue(renewal?: StudentRenewalSummary | null): string {
  const { label, detail } = studentRenewalDisplay(renewal);
  if (detail) return `${label} (${detail})`;
  return label;
}
