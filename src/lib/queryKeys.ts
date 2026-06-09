export const queryKeys = {
  branches: {
    all: ["branches"] as const,
    list: (params?: Record<string, unknown>) => ["branches", "list", params] as const,
  },
  counsellors: {
    all: ["counsellors"] as const,
    list: (params?: Record<string, unknown>) => ["counsellors", "list", params] as const,
  },
  students: {
    all: ["students"] as const,
    list: (params?: Record<string, unknown>) => ["students", "list", params] as const,
    detail: (id: string) => ["students", id] as const,
    registrations: (id: string) => ["students", id, "registrations"] as const,
  },
  plans: {
    all: ["plans"] as const,
    list: (params?: Record<string, unknown>) => ["plans", "list", params] as const,
    effectivePricing: (planId: string, branchId?: string, durationMonths?: number) =>
      ["plans", planId, "effective-pricing", branchId, durationMonths] as const,
  },
  seats: {
    availability: (params: Record<string, unknown>) => ["seats", "availability", params] as const,
  },
  payments: {
    list: (params?: Record<string, unknown>) => ["payments", "list", params] as const,
    studentSummary: (studentIdOrCode: string) => ["payments", "student-summary", studentIdOrCode] as const,
  },
  renewals: {
    list: (params?: Record<string, unknown>) => ["renewals", "list", params] as const,
  },
  reports: {
    branchDashboard: (params?: Record<string, unknown>) => ["reports", "branch", "dashboard", params] as const,
    branchOccupancy: (params?: Record<string, unknown>) => ["reports", "branch", "occupancy", params] as const,
    branchRevenue: (params?: Record<string, unknown>) => ["reports", "branch", "revenue", params] as const,
    branchRenewalsDue: (params?: Record<string, unknown>) => ["reports", "branch", "renewals-due", params] as const,
    branchRegistrationsByMonth: (params?: Record<string, unknown>) =>
      ["reports", "branch", "registrations-by-month", params] as const,
    superDashboard: (params?: Record<string, unknown>) => ["reports", "super", "dashboard", params] as const,
    superComparison: (params?: Record<string, unknown>) => ["reports", "super", "comparison", params] as const,
    superPlanDistribution: (params?: Record<string, unknown>) =>
      ["reports", "super", "plan-distribution", params] as const,
    superRegistrationsByMonth: (params?: Record<string, unknown>) =>
      ["reports", "super", "registrations-by-month", params] as const,
    branchBundle: (params?: Record<string, unknown>) => ["reports", "branch", "bundle", params] as const,
    superBundle: (params?: Record<string, unknown>) => ["reports", "super", "bundle", params] as const,
  },
  receipts: {
    list: (params?: Record<string, unknown>) => ["receipts", "list", params] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, unknown>) => ["notifications", "list", params] as const,
    unreadCount: (params?: Record<string, unknown>) => ["notifications", "unread", params] as const,
  },
};
