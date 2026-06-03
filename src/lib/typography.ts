import type { ClassValue } from "clsx";
import { cn } from "@/lib/utils";

/**
 * Centralized typography tokens — Inter (body/UI), Geist Sans (headings).
 * Compose with `cn(typography.pageTitle, className)` or `text("pageTitle", className)`.
 */
export const typography = {
  /* Display & page structure */
  display: "font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl",
  pageTitle: "font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl",
  pageDescription: "text-sm font-normal leading-relaxed text-muted-foreground max-w-2xl",

  /* Section & card headings */
  sectionTitle: "font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl",
  subsectionTitle: "font-heading text-base font-semibold tracking-tight text-foreground",
  cardTitle: "font-heading text-sm font-semibold tracking-tight text-foreground",

  /* Body copy */
  body: "text-sm font-normal leading-relaxed text-foreground",
  bodyMd: "text-base font-normal leading-relaxed text-foreground",
  bodyMedium: "text-sm font-medium leading-snug text-foreground",
  bodyStrong: "text-sm font-semibold text-foreground",

  /* Metadata & captions */
  muted: "text-xs font-normal text-muted-foreground",
  mutedMedium: "text-xs font-medium text-muted-foreground",
  caption: "text-xs font-normal leading-normal text-muted-foreground",
  paginationMeta: "text-sm font-normal text-muted-foreground",

  /* Navigation & chrome */
  navItem: "text-sm font-medium leading-none",
  navItemActive: "text-sm font-medium leading-none text-primary",
  navUserName: "text-xs font-medium text-foreground",
  navUserRole: "text-xs font-normal text-muted-foreground capitalize",
  breadcrumb: "text-sm font-normal text-muted-foreground",
  breadcrumbCurrent: "text-sm font-medium text-foreground",

  /* Data tables */
  tableHeader:
    "text-sm font-semibold text-muted-foreground tracking-normal normal-case",
  tableCell: "text-sm font-medium text-foreground",
  tableCellMuted: "text-sm font-normal text-muted-foreground",
  tableNumeric: "text-sm font-medium tabular-nums text-foreground",
  monoCode: "font-mono text-xs font-normal text-muted-foreground",

  /* Dashboard & analytics */
  metricLabel: "text-sm font-medium text-muted-foreground",
  metricValue:
    "font-heading text-2xl font-semibold tracking-tight tabular-nums text-foreground sm:text-[1.75rem]",
  metricTrend: "text-xs font-medium",
  chartAxis: "text-xs font-medium fill-muted-foreground",
  chartLegend: "text-xs font-medium text-muted-foreground",

  /** Recharts axis `tick` prop — 12px medium weight */
  chartTick: { fontSize: 12, fontWeight: 500, fill: "#64748b" } as const,

  /* Forms */
  label: "text-xs font-medium leading-none text-foreground",
  input: "text-sm font-normal text-foreground",
  inputPlaceholder: "placeholder:text-muted-foreground/60 placeholder:font-normal",
  formHint: "text-xs font-normal text-muted-foreground",
  formError: "text-xs font-medium text-destructive",

  /* Actions & status */
  button: "text-sm font-medium",
  badge: "text-xs font-medium leading-none",
  dropdownLabel: "text-xs font-semibold text-muted-foreground",
  dropdownItem: "text-sm font-normal",

  /* Overlays */
  dialogTitle: "font-heading text-lg font-semibold tracking-tight text-foreground",
  dialogDescription: "text-sm font-normal leading-relaxed text-muted-foreground",
  emptyTitle: "font-heading text-sm font-semibold text-foreground",
  emptyDescription: "text-sm font-normal text-muted-foreground",
} as const;

export type TypographyToken = keyof typeof typography;

/** Apply a typography token with optional class overrides. */
export function text(token: TypographyToken, ...classes: ClassValue[]) {
  return cn(typography[token], ...classes);
}
