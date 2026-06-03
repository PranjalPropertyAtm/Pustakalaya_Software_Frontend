import { z } from "zod";
import { mobileNumberSchema, optionalMobileSchema } from "@/schemas/zodHelpers";

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, "Invalid selection");

export const studentRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name is required").max(120),
    mobileNumber: mobileNumberSchema,
    parentContact: optionalMobileSchema,
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
