import { z } from "zod";
import { PLAN_NAMES } from "@/lib/constants";

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const default6hrShiftFormValues = {
  shiftAStart: "06:00",
  shiftAEnd: "12:00",
  shiftBStart: "13:00",
  shiftBEnd: "19:00",
} as const;

const sixHrShiftFieldsSchema = z.object({
  shiftAStart: z.string().optional(),
  shiftAEnd: z.string().optional(),
  shiftBStart: z.string().optional(),
  shiftBEnd: z.string().optional(),
});

function validateSixHrShiftFields(
  data: z.infer<typeof sixHrShiftFieldsSchema>,
  ctx: z.RefinementCtx
) {
  const shiftFields = [
    { key: "shiftAStart" as const, label: "Shift A start" },
    { key: "shiftAEnd" as const, label: "Shift A end" },
    { key: "shiftBStart" as const, label: "Shift B start" },
    { key: "shiftBEnd" as const, label: "Shift B end" },
  ];

  for (const { key, label } of shiftFields) {
    const value = data[key]?.trim();
    if (!value) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${label} is required` });
    } else if (!hhmmRegex.test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: "Use HH:mm format" });
    }
  }

  if (data.shiftAStart && data.shiftAEnd && hhmmRegex.test(data.shiftAStart) && hhmmRegex.test(data.shiftAEnd)) {
    const span = toMinutes(data.shiftAEnd) - toMinutes(data.shiftAStart);
    if (span !== 360) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shiftAEnd"],
        message: "Shift A must be exactly 6 hours",
      });
    }
  }

  if (data.shiftBStart && data.shiftBEnd && hhmmRegex.test(data.shiftBStart) && hhmmRegex.test(data.shiftBEnd)) {
    const span = toMinutes(data.shiftBEnd) - toMinutes(data.shiftBStart);
    if (span !== 360) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["shiftBEnd"],
        message: "Shift B must be exactly 6 hours",
      });
    }
  }
}

export const sixHrShiftTimingsSchema = sixHrShiftFieldsSchema.superRefine(validateSixHrShiftFields);

export type SixHrShiftFormValues = z.infer<typeof sixHrShiftTimingsSchema>;

export const createPlanSchema = z
  .object({
    name: z.enum(PLAN_NAMES),
    isActive: z.boolean().optional(),
  })
  .merge(sixHrShiftFieldsSchema)
  .superRefine((data, ctx) => {
    if (data.name === "6hr") validateSixHrShiftFields(data, ctx);
  });

export type CreatePlanFormValues = z.infer<typeof createPlanSchema>;

export function shiftTimingsToFormValues(
  shiftTimings?: Array<{ code: string; startTime: string; endTime: string }>
): SixHrShiftFormValues {
  const shiftA = shiftTimings?.find((s) => s.code === "A");
  const shiftB = shiftTimings?.find((s) => s.code === "B");
  return {
    shiftAStart: shiftA?.startTime ?? default6hrShiftFormValues.shiftAStart,
    shiftAEnd: shiftA?.endTime ?? default6hrShiftFormValues.shiftAEnd,
    shiftBStart: shiftB?.startTime ?? default6hrShiftFormValues.shiftBStart,
    shiftBEnd: shiftB?.endTime ?? default6hrShiftFormValues.shiftBEnd,
  };
}

export function formValuesToShiftTimings(values: SixHrShiftFormValues) {
  return [
    { code: "A" as const, startTime: values.shiftAStart!, endTime: values.shiftAEnd! },
    { code: "B" as const, startTime: values.shiftBStart!, endTime: values.shiftBEnd! },
  ];
}

export const planPricingSchema = z.object({
  branchId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  amount: z.number().nonnegative("Amount must be positive"),
  currency: z.string().optional(),
  effectiveFrom: z.string().min(1, "Effective date is required"),
});

export type PlanPricingFormValues = z.infer<typeof planPricingSchema>;
