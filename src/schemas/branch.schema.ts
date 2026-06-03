import { z } from "zod";
import { mobileNumberSchema } from "@/schemas/zodHelpers";

const hhmm = z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format (e.g. 08:00)");

export const createBranchSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  address: z.string().trim().min(5, "Address is required"),
  contactNumber: mobileNumberSchema,
  totalSeats: z.number().int().positive("At least 1 seat"),
  floors: z.number().int().positive("At least 1 floor"),
  openingTime: hhmm,
  closingTime: hhmm,
});

export type CreateBranchFormValues = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.extend({
  isActive: z.boolean(),
});

export type UpdateBranchFormValues = z.infer<typeof updateBranchSchema>;
