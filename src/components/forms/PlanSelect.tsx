import { Controller, type Control, type FieldError } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { getPlanId, getPlanLabel } from "@/lib/plan";
import type { StudentRegistrationFormValues } from "@/schemas/student.schema";
import { FormField } from "@/components/forms/FormField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlanSelectProps {
  control: Control<StudentRegistrationFormValues>;
  error?: FieldError;
  required?: boolean;
  label?: string;
  activeOnly?: boolean;
}

export function PlanSelect({
  control,
  error,
  required = true,
  label = "Plan",
  activeOnly = true,
}: PlanSelectProps) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.plans.list({ activeOnly }),
    queryFn: () => plansService.list(activeOnly ? { isActive: "true" } : {}),
  });

  const plans = data?.items ?? [];

  return (
    <FormField label={label} error={error} required={required}>
      <Controller
        control={control}
        name="planId"
        render={({ field }) => (
          <Select
            value={field.value ?? ""}
            onValueChange={(v) => field.onChange(v)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={isLoading ? "Loading plans..." : "Select plan"}
              />
            </SelectTrigger>
            <SelectContent>
              {plans.map((p) => {
                const id = getPlanId(p);
                return (
                  <SelectItem key={id} value={id}>
                    {getPlanLabel(p)}
                    {p.durationHours != null && ` (${p.durationHours}h)`}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      />
    </FormField>
  );
}
