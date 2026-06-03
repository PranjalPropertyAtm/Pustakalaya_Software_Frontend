import { useEffect } from "react";
import { Controller, type Control, type FieldErrors, type UseFormSetValue, type UseFormWatch } from "react-hook-form";
import type { Plan } from "@/types/domain";
import type { StudentRegistrationFormValues } from "@/schemas/student.schema";
import { SHIFT_CODES } from "@/lib/constants";
import {
  isShiftBasedPlan,
  getPlanDurationHours,
  addHoursToTime,
  formatPlanSchedule,
} from "@/lib/plan";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PlanScheduleFieldsProps {
  control: Control<StudentRegistrationFormValues>;
  watch: UseFormWatch<StudentRegistrationFormValues>;
  setValue: UseFormSetValue<StudentRegistrationFormValues>;
  errors: FieldErrors<StudentRegistrationFormValues>;
  selectedPlan?: Plan | null;
}

export function PlanScheduleFields({
  control,
  watch,
  setValue,
  errors,
  selectedPlan,
}: PlanScheduleFieldsProps) {
  const shiftBased = isShiftBasedPlan(selectedPlan);
  const durationHours = getPlanDurationHours(selectedPlan);
  const shiftCode = watch("shiftCode");
  const preferredStart = watch("preferredStartTime");
  const preferredEnd = watch("preferredEndTime");

  useEffect(() => {
    if (!selectedPlan) return;
    if (shiftBased) {
      setValue("preferredStartTime", "");
      setValue("preferredEndTime", "");
      if (!shiftCode) setValue("shiftCode", "A");
    } else {
      setValue("shiftCode", undefined);
    }
  }, [selectedPlan, shiftBased, setValue, shiftCode]);

  useEffect(() => {
    if (shiftBased || !preferredStart || !durationHours) return;
    const end = addHoursToTime(preferredStart, durationHours);
    setValue("preferredEndTime", end, { shouldValidate: true });
  }, [preferredStart, durationHours, shiftBased, setValue]);

  if (!selectedPlan) {
    return (
      <p className="text-sm text-muted-foreground sm:col-span-2">
        Select a plan first to configure shift or daily timing.
      </p>
    );
  }

  if (shiftBased) {
    const selectedShift = selectedPlan.shiftTimings?.find((s) => s.code === shiftCode);
    return (
      <FormField
        label="Shift (6hr plan)"
        error={errors.shiftCode}
        required
        className="sm:col-span-2"
        hint="6 घंटे के प्लान में Shift A या B — समय प्लान में तय है"
      >
        <Controller
          control={control}
          name="shiftCode"
          render={({ field }) => (
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select shift" />
              </SelectTrigger>
              <SelectContent>
                {SHIFT_CODES.map((s) => {
                  const timing = selectedPlan.shiftTimings?.find((t) => t.code === s);
                  return (
                    <SelectItem key={s} value={s}>
                      Shift {s}
                      {timing ? ` (${timing.startTime} – ${timing.endTime})` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        />
        {selectedShift && (
          <p className="text-xs text-secondary font-medium mt-1">
            इस shift का समय: {selectedShift.startTime} से {selectedShift.endTime} तक (6 घंटे)
          </p>
        )}
      </FormField>
    );
  }

  return (
    <>
      <FormField
        label={`Start time (${durationHours}hr plan)`}
        error={errors.preferredStartTime}
        required
        hint={`कितने बजे से — ${durationHours} घंटे की slot`}
      >
        <Controller
          control={control}
          name="preferredStartTime"
          render={({ field }) => (
            <Input type="time" value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </FormField>
      <FormField
        label={`End time (${durationHours}hr plan)`}
        error={errors.preferredEndTime}
        required
        hint="Start time के बाद auto-fill; जरूरत हो तो बदलें"
      >
        <Controller
          control={control}
          name="preferredEndTime"
          render={({ field }) => (
            <Input type="time" value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </FormField>
      {preferredStart && preferredEnd && (
        <p className="text-xs text-secondary font-medium sm:col-span-2">
          Daily slot: {formatPlanSchedule(selectedPlan, null, preferredStart, preferredEnd)} ({durationHours}{" "}
          घंटे)
        </p>
      )}
    </>
  );
}
