import { z } from "zod";
import { PLAN_NAMES } from "@/lib/constants";

export const createPlanSchema = z.object({
  name: z.enum(PLAN_NAMES),
  isActive: z.boolean().optional(),
});

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export const planPricingSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  amount: z.number().nonnegative("Amount must be positive"),
  currency: z.string().optional(),
  effectiveFrom: z.string().min(1, "Effective date is required"),
});

export type PlanPricingFormValues = z.infer<typeof planPricingSchema>;
