/** Client-side date range check (inclusive) for ISO date strings or YYYY-MM-DD inputs. */
export function isWithinDateRange(
  isoDate: string | undefined,
  from?: string,
  to?: string
): boolean {
  if (!isoDate) return !from && !to;
  const t = new Date(isoDate).getTime();
  if (Number.isNaN(t)) return false;

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    if (t < start.getTime()) return false;
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (t > end.getTime()) return false;
  }
  return true;
}
