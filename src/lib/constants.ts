export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COUNSELLOR: "COUNSELLOR",
  BRANCH_COUNSELLOR: "BRANCH_COUNSELLOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PAYMENT_METHODS = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"] as const;

/** Must match backend constants/payments.js */
export const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
] as const;

export const PAYMENT_TYPES = [
  { value: "registration", label: "Registration" },
  { value: "renewal", label: "Renewal" },
  { value: "partial", label: "Partial" },
  { value: "adjustment", label: "Adjustment" },
  { value: "other", label: "Other" },
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]["value"];
export type PaymentType = (typeof PAYMENT_TYPES)[number]["value"];
export const SHIFT_CODES = ["A", "B"] as const;

/** Must match backend constants/parentContact.js */
export const PARENT_CONTACT_RELATIONS = [
  { value: "FATHER", label: "Father" },
  { value: "MOTHER", label: "Mother" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "SIBLING", label: "Sibling" },
  { value: "FRIEND", label: "Friend" },
  { value: "OTHER", label: "Other" },
] as const;

export type ParentContactRelation = (typeof PARENT_CONTACT_RELATIONS)[number]["value"];
export const STUDENT_STATUSES = [
  "active",
  "pending",
  "expired",
  "suspended",
  "cancelled",
  "inactive",
] as const;

/** Must match backend constants/enrollment.js */
export const ENROLLMENT_TYPES = [
  { value: "NEW", label: "New student" },
  { value: "REJOIN", label: "Rejoining student" },
] as const;

export type EnrollmentType = (typeof ENROLLMENT_TYPES)[number]["value"];

/** Must match backend students list renewal filter */
export const STUDENT_RENEWAL_FILTERS = [{ value: "renewed", label: "Renewed" }] as const;

export type StudentRenewalFilter = (typeof STUDENT_RENEWAL_FILTERS)[number]["value"];

/** Combined student list filter — registration + renewal options */
export const STUDENT_TYPE_FILTERS = [
  ...ENROLLMENT_TYPES,
  ...STUDENT_RENEWAL_FILTERS,
] as const;

export type StudentTypeFilter = (typeof STUDENT_TYPE_FILTERS)[number]["value"];

/** Must match backend plan.model.js PLAN_NAMES */
export const PLAN_NAMES = ["6hr", "8hr", "10hr", "12hr"] as const;

/** Must match backend constants/currency.js */
export const DEFAULT_CURRENCY = "INR";

export const RUPEE_SYMBOL = "₹";
