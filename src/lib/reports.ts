import type { PlanDistributionItem, PlanWiseRow, ShiftWiseRow } from "@/types/reports";

export function defaultReportDateRange(days = 30) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function formatReportDateRange(from?: string, to?: string) {
  if (!from || !to) return "Last 30 days";
  return `${from} → ${to}`;
}

export function planWiseChartData(rows: PlanWiseRow[] | undefined) {
  return (rows ?? []).map((row) => ({
    name: row.planName,
    value: row.activeStudents,
  }));
}

export function shiftWiseChartData(rows: ShiftWiseRow[] | undefined) {
  return (rows ?? []).map((row) => ({
    name: row.shiftCode === "—" ? "No shift" : row.shiftCode,
    value: row.activeStudents,
  }));
}

export function planDistributionChartData(rows: PlanDistributionItem[] | undefined) {
  return (rows ?? []).map((row) => ({
    name: row.planName,
    value: row.studentCount,
  }));
}

export function branchActiveStudentsChartData(
  branches: { branchName: string; activeStudents: number }[] | undefined
) {
  return (branches ?? [])
    .filter((b) => b.activeStudents > 0)
    .sort((a, b) => b.activeStudents - a.activeStudents)
    .slice(0, 8)
    .map((b) => ({
      name: b.branchName,
      value: b.activeStudents,
    }));
}
