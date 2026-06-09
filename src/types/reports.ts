export interface DateRange {
  from: string;
  to: string;
}

export interface StatusCount {
  _id: string;
  count: number;
}

export interface PlanWiseRow {
  planName: string;
  planId: string;
  activeStudents: number;
  occupancyPercent: number;
}

export interface ShiftWiseRow {
  shiftCode: string;
  activeStudents: number;
}

export interface BranchDashboardResponse {
  branch: { id: string; name: string; totalSeats: number };
  dateRange: DateRange;
  metrics: {
    activeStudents: number;
    studentsByStatus: StatusCount[];
    occupancy: {
      occupiedSeats: number;
      totalSeats: number;
      occupancyPercent: number;
    };
    planWise: PlanWiseRow[];
    shiftWise: ShiftWiseRow[];
    revenueCollected: {
      totalAmount: number;
      transactionCount: number;
      currency: string;
    };
    renewalsDueCount: number;
  };
}

export interface SuperBranchCard {
  branchId: string;
  branchName: string;
  totalSeats: number;
  activeStudents: number;
  expiredStudents: number;
  revenue: number;
  paymentCount: number;
  occupancyPercent: number;
}

export interface PlanDistributionItem {
  planId: string;
  planName: string;
  durationHours?: number;
  occupancyType?: string;
  studentCount: number;
  sharePercent?: number;
}

export interface SuperDashboardResponse {
  dateRange: DateRange;
  totals: {
    branches: number;
    totalRevenue: number;
    activeStudents: number;
    expiredStudents: number;
  };
  branches: SuperBranchCard[];
  planDistribution: PlanDistributionItem[];
}

export interface BranchOccupancyResponse {
  branch: { id: string; name: string; totalSeats: number };
  occupancyPercent: number;
  activeStudents: number;
  planWise: PlanWiseRow[];
  shiftWise: ShiftWiseRow[];
}

export interface RevenueReportRow {
  paymentNumber: string;
  paidAt: string;
  amount: number;
  currency: string;
  paymentMode: string;
  type: string;
  studentCode: string;
  studentName: string;
}

export interface BranchRevenueResponse {
  dateRange: DateRange;
  summary: {
    totalAmount: number;
    transactionCount: number;
    currency: string;
  };
  page: number;
  limit: number;
  totalDocs: number;
  items: RevenueReportRow[];
}

export interface ExpiringStudentRow {
  studentCode: string;
  fullName: string;
  mobileNumber: string;
  plan: string;
  endDate: string;
}

export interface BranchRenewalsDueResponse {
  mode: "expiring" | "open_renewals";
  dateWindow: { endFrom: string; endTo: string };
  page: number;
  limit: number;
  totalDocs: number;
  items: ExpiringStudentRow[];
}

export interface BranchComparisonRow {
  branchId: string;
  branchName: string;
  isActive: boolean;
  totalSeats: number;
  revenue: number;
  paymentCount: number;
  occupancyPercent: number;
  activeStudents: number;
  expiredStudents: number;
}

export interface SuperComparisonResponse {
  dateRange: DateRange;
  comparison: BranchComparisonRow[];
  activeVsExpired: {
    branches: { branchId: string; branchName: string; active: number; expired: number }[];
    totals: { active: number; expired: number };
  };
}

export interface SuperPlanDistributionResponse {
  totalStudentsWithPlan: number;
  distribution: PlanDistributionItem[];
}

export interface MonthlyRegistrationRow {
  year: number;
  month: number;
  monthKey: string;
  studentCount: number;
}

export interface RegistrationsByMonthResponse {
  dateRange: DateRange;
  totalRegistrations: number;
  months: MonthlyRegistrationRow[];
}

export interface BranchRegistrationsByMonthResponse extends RegistrationsByMonthResponse {
  branch: { id: string; name: string };
}
