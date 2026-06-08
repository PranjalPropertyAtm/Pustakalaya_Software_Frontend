export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COUNSELLOR: "COUNSELLOR",
  BRANCH_COUNSELLOR: "BRANCH_COUNSELLOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"] as const;
export const SHIFT_CODES = ["A", "B"] as const;
export const STUDENT_STATUSES = [
  "active",
  "pending",
  "expired",
  "suspended",
  "cancelled",
  "inactive",
] as const;

/** Must match backend plan.model.js PLAN_NAMES */
export const PLAN_NAMES = ["6hr", "8hr", "10hr", "12hr"] as const;

/** Must match backend constants/currency.js */
export const DEFAULT_CURRENCY = "INR";

export const RUPEE_SYMBOL = "₹";
