import { z } from "zod";
import { mobileNumberSchema, optionalMobileSchema } from "@/schemas/zodHelpers";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid selection");

export const ENQUIRY_SOURCES = [
  { value: "walk_in", label: "Walk In" },
  { value: "reference", label: "Reference" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google" },
  { value: "banner", label: "Banner" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "existing_student", label: "Existing Student" },
  { value: "other", label: "Other" },
] as const;

export const ENQUIRY_PURPOSES = [
  { value: "study", label: "Study" },
  { value: "competitive_exam", label: "Competitive Exam" },
  { value: "office_work", label: "Office Work" },
  { value: "reading", label: "Reading" },
  { value: "other", label: "Other" },
] as const;

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "follow_up", label: "Follow-up" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not Interested" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export const ENQUIRY_GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export const REMINDER_TYPES = [
  { value: "call_tomorrow", label: "Call tomorrow" },
  { value: "call_after_days", label: "Call after N days" },
  { value: "visit", label: "Visit reminder" },
  { value: "custom", label: "Custom" },
] as const;

const sourceValues = ENQUIRY_SOURCES.map((s) => s.value) as [string, ...string[]];
const purposeValues = ENQUIRY_PURPOSES.map((p) => p.value) as [string, ...string[]];
const statusValues = ENQUIRY_STATUSES.map((s) => s.value) as [string, ...string[]];
const genderValues = ENQUIRY_GENDERS.map((g) => g.value) as [string, ...string[]];
const reminderTypeValues = REMINDER_TYPES.map((r) => r.value) as [string, ...string[]];

const timeString = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format")
  .optional()
  .or(z.literal(""));

export const enquiryFormSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required").max(120),
  mobileNumber: mobileNumberSchema,
  alternateMobile: optionalMobileSchema,
  email: z.string().trim().email().optional().or(z.literal("")),
  age: z.string().trim().optional().or(z.literal("")),
  gender: z.enum(genderValues).optional().nullable().or(z.literal("")),
  branchId: objectId,
  interestedPlanId: objectId.optional().or(z.literal("")),
  preferredShift: z.enum(["A", "B"]).optional().or(z.literal("")),
  expectedJoiningDate: z.string().trim().optional().or(z.literal("")),
  occupation: z.string().trim().max(120).optional().or(z.literal("")),
  collegeSchool: z.string().trim().max(200).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  source: z.enum(sourceValues),
  purpose: z.enum(purposeValues),
  budget: z.string().trim().max(80).optional().or(z.literal("")),
  remarks: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(statusValues).optional(),
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;

export const followUpFormSchema = z.object({
  followUpDate: z.string().trim().min(1, "Date is required"),
  followUpTime: timeString,
  remark: z.string().trim().min(1, "Remark is required").max(2000),
  nextFollowUpDate: z.string().trim().optional().or(z.literal("")),
  nextFollowUpTime: timeString,
  reminderSet: z.boolean().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "overdue"]).optional(),
});

export type FollowUpFormValues = z.infer<typeof followUpFormSchema>;

export const reminderFormSchema = z
  .object({
    reminderType: z.enum(reminderTypeValues),
    title: z.string().trim().max(200).optional().or(z.literal("")),
    message: z.string().trim().max(1000).optional().or(z.literal("")),
    offsetDays: z.number().int().min(0).max(365).optional(),
    dueAt: z.string().trim().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.reminderType === "call_after_days" && (data.offsetDays == null || data.offsetDays < 1)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["offsetDays"],
        message: "Enter number of days (minimum 1)",
      });
    }
    if (data.reminderType === "custom" && !data.dueAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dueAt"],
        message: "Due date is required for custom reminders",
      });
    }
  });

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;

export function createEnquiryDefaultValues(branchId = ""): EnquiryFormValues {
  return {
    fullName: "",
    mobileNumber: "",
    alternateMobile: "",
    email: "",
    age: "",
    gender: "",
    branchId,
    interestedPlanId: "",
    preferredShift: "",
    expectedJoiningDate: "",
    occupation: "",
    collegeSchool: "",
    address: "",
    source: "walk_in",
    purpose: "study",
    budget: "",
    remarks: "",
    status: "new",
  };
}

export function enquiryToFormValues(enquiry: {
  fullName: string;
  mobileNumber: string;
  alternateMobile?: string;
  email?: string;
  age?: number | null;
  gender?: string | null;
  branchId: string;
  interestedPlanId?: string | null;
  preferredShift?: string | null;
  expectedJoiningDate?: string | null;
  occupation?: string;
  collegeSchool?: string;
  address?: string;
  source: string;
  purpose: string;
  budget?: string;
  remarks?: string;
  status: string;
}): EnquiryFormValues {
  return {
    fullName: enquiry.fullName,
    mobileNumber: enquiry.mobileNumber,
    alternateMobile: enquiry.alternateMobile ?? "",
    email: enquiry.email ?? "",
    age: enquiry.age != null ? String(enquiry.age) : "",
    gender: (enquiry.gender as EnquiryFormValues["gender"]) ?? "",
    branchId: enquiry.branchId,
    interestedPlanId: enquiry.interestedPlanId ?? "",
    preferredShift: (enquiry.preferredShift as "A" | "B" | "") ?? "",
    expectedJoiningDate: enquiry.expectedJoiningDate
      ? new Date(enquiry.expectedJoiningDate).toISOString().slice(0, 10)
      : "",
    occupation: enquiry.occupation ?? "",
    collegeSchool: enquiry.collegeSchool ?? "",
    address: enquiry.address ?? "",
    source: enquiry.source as EnquiryFormValues["source"],
    purpose: enquiry.purpose as EnquiryFormValues["purpose"],
    budget: enquiry.budget ?? "",
    remarks: enquiry.remarks ?? "",
    status: enquiry.status as EnquiryFormValues["status"],
  };
}
