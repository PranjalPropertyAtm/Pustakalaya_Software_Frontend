import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Select a branch");

export const createCounsellorSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  branchId: objectId,
});

export type CreateCounsellorFormValues = z.infer<typeof createCounsellorSchema>;

export const updateCounsellorSchema = z.object({
  fullName: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().email("Valid email required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  branchId: objectId,
  isActive: z.boolean(),
});

export type UpdateCounsellorFormValues = z.infer<typeof updateCounsellorSchema>;
