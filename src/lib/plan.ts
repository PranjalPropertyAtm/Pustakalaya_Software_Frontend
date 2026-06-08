import type { Plan } from "@/types/domain";

export function getPlanId(plan: Plan): string {
  return plan.id ?? plan._id ?? "";
}

export function getPlanLabel(plan: Plan): string {
  return plan.name;
}

export function isShiftBasedPlan(
  plan?: Pick<Plan, "name" | "occupancyType"> | null
): boolean {
  if (!plan) return false;
  return plan.name === "6hr" || plan.occupancyType === "SHIFT_BASED";
}

export function getPlanDurationHours(plan?: Plan | null): number {
  if (!plan) return 0;
  if (plan.durationHours) return plan.durationHours;
  const match = plan.name?.match(/^(\d+)hr$/);
  if (match) return Number(match[1]);
  return 0;
}

export function addHoursToTime(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function formatPlanSchedule(
  plan?: Pick<Plan, "name" | "shiftTimings" | "durationHours" | "occupancyType"> | null,
  shiftCode?: string | null,
  start?: string | null,
  end?: string | null
) {
  if (isShiftBasedPlan(plan) && shiftCode) {
    const shift = plan?.shiftTimings?.find((s) => s.code === shiftCode);
    if (shift) return `Shift ${shiftCode}: ${shift.startTime} – ${shift.endTime}`;
    return `Shift ${shiftCode}`;
  }
  if (start && end) return `${start} – ${end}`;
  return "";
}
