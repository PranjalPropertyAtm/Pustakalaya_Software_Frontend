import { z } from "zod";
import { mobileNumberSchema, optionalMobileSchema } from "@/schemas/zodHelpers";
import { PARENT_CONTACT_RELATIONS, type ParentContactRelation } from "@/lib/constants";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid selection");

const parentContactRelationValues = PARENT_CONTACT_RELATIONS.map((item) => item.value) as [
  (typeof PARENT_CONTACT_RELATIONS)[number]["value"],
  ...(typeof PARENT_CONTACT_RELATIONS)[number]["value"][],
];

const parentContactRelationSchema = z.enum(parentContactRelationValues).optional().or(z.literal(""));

const refineParentContactPair = (
  data: { parentContact?: string; parentContactRelation?: string; parentContactName?: string },
  ctx: z.RefinementCtx
) => {
  const contact = data.parentContact?.trim() || "";
  const relation = data.parentContactRelation?.trim() || "";
  const name = data.parentContactName?.trim() || "";
  if (contact && !relation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentContactRelation"],
      message: "Select whose contact number this is",
    });
  }
  if (relation && !contact) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentContact"],
      message: "Contact number is required",
    });
  }
  if (relation && !name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["parentContactName"],
      message: "Contact person name is required",
    });
  }
};

export const studentRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name is required").max(120),
    mobileNumber: mobileNumberSchema,
    parentContact: optionalMobileSchema,
    parentContactRelation: parentContactRelationSchema,
    parentContactName: z.string().trim().max(120).optional().or(z.literal("")),
    address: z.string().trim().min(5, "Address is required").max(500),
    email: z.string().trim().email().optional().or(z.literal("")),
    branchId: objectId,
    planId: objectId,
    seatId: objectId,
    shiftCode: z.enum(["A", "B"]).optional(),
    preferredStartTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format")
      .optional()
      .or(z.literal("")),
    preferredEndTime: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format")
      .optional()
      .or(z.literal("")),
    joiningDate: z.string().trim().min(1, "Joining date is required"),
    startDate: z.string().trim().min(1, "Start date is required"),
    durationMonths: z.number().int().min(1).max(36),
    collectPaymentNow: z.boolean(),
    paymentAmount: z.number().min(0).optional(),
    currency: z.string().trim().min(2).max(8).optional(),
    paymentMethod: z.enum(["CASH", "UPI", "CARD", "BANK_TRANSFER", "OTHER"]).optional(),
    paymentReference: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((data) => new Date(data.startDate) >= new Date(data.joiningDate), {
    message: "Start date cannot be before joining date",
    path: ["startDate"],
  })
  .superRefine((data, ctx) => {
    refineParentContactPair(data, ctx);
    if (!data.collectPaymentNow) return;
    if (!data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Payment method is required when recording payment now",
      });
    }
    if (data.paymentAmount == null || Number.isNaN(data.paymentAmount) || data.paymentAmount < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentAmount"],
        message: "Payment amount is required when recording payment now",
      });
    }
  });

export type StudentRegistrationFormValues = z.infer<typeof studentRegistrationSchema>;

export const updateStudentSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name is required").max(120),
    mobileNumber: mobileNumberSchema,
    parentContact: optionalMobileSchema,
    parentContactRelation: parentContactRelationSchema,
    parentContactName: z.string().trim().max(120).optional().or(z.literal("")),
    address: z.string().trim().min(5, "Address is required").max(500),
    email: z.string().trim().email().optional().or(z.literal("")),
    notes: z.string().trim().max(1000).optional(),
  })
  .superRefine(refineParentContactPair);

export type UpdateStudentFormValues = z.infer<typeof updateStudentSchema>;

export function studentToUpdateFormValues(student: {
  fullName: string;
  mobileNumber: string;
  parentContact?: string;
  parentContactRelation?: string | null;
  parentContactName?: string;
  address?: string;
  email?: string | null;
  notes?: string;
}): UpdateStudentFormValues {
  return {
    fullName: student.fullName,
    mobileNumber: student.mobileNumber,
    parentContact: student.parentContact ?? "",
    parentContactRelation: PARENT_CONTACT_RELATIONS.some(
      (item) => item.value === student.parentContactRelation
    )
      ? (student.parentContactRelation as ParentContactRelation)
      : "",
    parentContactName: student.parentContactName ?? "",
    address: student.address ?? "",
    email: student.email ?? "",
    notes: student.notes ?? "",
  };
}

/** Shared defaults — keep in sync with schema (especially collectPaymentNow). */
export function createStudentRegistrationDefaultValues(
  branchId = ""
): Partial<StudentRegistrationFormValues> {
  const today = new Date().toISOString().slice(0, 10);
  return {
    durationMonths: 1,
    branchId,
    joiningDate: today,
    startDate: today,
    collectPaymentNow: false,
  };
}
