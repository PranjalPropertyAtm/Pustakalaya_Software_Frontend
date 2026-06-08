import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { Input } from "@/components/ui/input";
import type { SixHrShiftFormValues } from "@/schemas/plan.schema";

interface SixHrShiftFieldsProps<T extends SixHrShiftFormValues> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}

export function SixHrShiftFields<T extends SixHrShiftFormValues>({
  register,
  errors,
}: SixHrShiftFieldsProps<T>) {
  return (
    <div className="space-y-4 rounded-md border border-border/80 bg-muted/20 p-3">
      <p className="text-sm font-medium">Shift timings (6 hours each)</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Shift A start" error={errors.shiftAStart} required>
          <Input type="time" {...register("shiftAStart")} />
        </FormField>
        <FormField label="Shift A end" error={errors.shiftAEnd} required>
          <Input type="time" {...register("shiftAEnd")} />
        </FormField>
        <FormField label="Shift B start" error={errors.shiftBStart} required>
          <Input type="time" {...register("shiftBStart")} />
        </FormField>
        <FormField label="Shift B end" error={errors.shiftBEnd} required>
          <Input type="time" {...register("shiftBEnd")} />
        </FormField>
      </div>
    </div>
  );
}
