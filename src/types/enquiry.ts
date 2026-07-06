import type { Branch, Plan } from "@/types/domain";

export type EnquiryStatus =
  | "new"
  | "follow_up"
  | "interested"
  | "not_interested"
  | "converted"
  | "closed"
  | "cancelled";

export type EnquirySource =
  | "walk_in"
  | "reference"
  | "instagram"
  | "facebook"
  | "google"
  | "banner"
  | "whatsapp"
  | "existing_student"
  | "other";

export type EnquiryPurpose =
  | "study"
  | "competitive_exam"
  | "office_work"
  | "reading"
  | "other";

export type EnquiryGender = "male" | "female" | "other" | "prefer_not_to_say";

export type ReminderType = "call_tomorrow" | "call_after_days" | "visit" | "custom";

export interface EnquiryUserRef {
  id: string;
  fullName: string;
  email?: string;
  role?: string;
}

export interface EnquiryStudentRef {
  id: string;
  fullName: string;
  studentCode?: string;
  mobileNumber?: string;
}

export interface Enquiry {
  id: string;
  _id?: string;
  enquiryCode: string;
  fullName: string;
  mobileNumber: string;
  alternateMobile?: string;
  parentName?: string;
  parentContact?: string;
  email?: string;
  age?: number | null;
  gender?: EnquiryGender | null;
  branchId: string;
  branch?: Pick<Branch, "name" | "address" | "contactNumber"> & { id?: string };
  interestedPlanId?: string | null;
  plan?: Pick<Plan, "name" | "durationHours" | "occupancyType"> & { id?: string };
  preferredShift?: "A" | "B" | null;
  expectedJoiningDate?: string | null;
  occupation?: string;
  collegeSchool?: string;
  address?: string;
  source: EnquirySource;
  purpose: EnquiryPurpose;
  budget?: string;
  remarks?: string;
  counsellorId: string;
  counsellor?: EnquiryUserRef;
  counsellorName: string;
  status: EnquiryStatus;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string;
  studentId?: string | null;
  student?: EnquiryStudentRef;
  convertedAt?: string | null;
  convertedBy?: string | null;
  convertedByUser?: EnquiryUserRef;
  closedAt?: string | null;
  closedBy?: string | null;
  closedByUser?: EnquiryUserRef;
  closeReason?: string;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string;
  createdBy?: string;
  createdByUser?: EnquiryUserRef;
  createdAt?: string;
  updatedAt?: string;
}

export interface FollowUp {
  id: string;
  enquiryId: string;
  branchId: string;
  followUpDate: string;
  followUpTime?: string;
  remark: string;
  nextFollowUpDate?: string | null;
  nextFollowUpTime?: string;
  reminderSet?: boolean;
  status: string;
  counsellorId: string;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderLog {
  id: string;
  enquiryId: string;
  branchId: string;
  userId: string;
  title: string;
  message?: string;
  reminderType: ReminderType;
  offsetDays?: number;
  dueAt: string;
  status: string;
  sentAt?: string | null;
  notificationId?: string | null;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EnquiryTimelineEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  status?: string;
  meta?: Record<string, unknown>;
}

export interface EnquiryDashboardMetrics {
  newEnquiries: number;
  todaysFollowUps: number;
  overdueFollowUps: number;
  interestedStudents: number;
  convertedThisMonth: number;
  conversionRate: number;
  dueReminders: number;
  totalInPeriod?: number;
  convertedInPeriod?: number;
}

export interface EnquiryReports {
  dateRange: { from: string; to: string };
  dailyEnquiries: { date: string; count: number }[];
  monthlyEnquiries: { month: string; count: number }[];
  branchWise: {
    branchId: string;
    branchName?: string;
    count: number;
    converted: number;
    conversionRate: number;
  }[];
  sourceWise: { source: string; count: number }[];
  planWise: { planId: string; planName?: string; count: number }[];
  counsellorPerformance: {
    counsellorId: string;
    counsellorName: string;
    total: number;
    converted: number;
    interested: number;
    conversionRate: number;
  }[];
  conversionRate: number;
  lostEnquiries: number;
  totalEnquiries: number;
  convertedEnquiries: number;
}

export interface EnquiryPrefillState {
  enquiryId: string;
  fullName?: string;
  mobileNumber?: string;
  parentContact?: string;
  parentContactName?: string;
  address?: string;
  branchId?: string;
  planId?: string;
  shiftCode?: "A" | "B";
  notes?: string;
  email?: string;
  expectedJoiningDate?: string;
}
