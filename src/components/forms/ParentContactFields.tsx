import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { MobileInput } from "@/components/forms/MobileInput";
import { mobileFieldRules } from "@/lib/inputHelpers";
import { PARENT_CONTACT_RELATIONS, type ParentContactRelation } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ParentContactFormValues = {
  parentContact?: string;
  parentContactRelation?: ParentContactRelation | "";
};

interface ParentContactFieldsProps {
  register: UseFormRegister<ParentContactFormValues>;
  control: Control<ParentContactFormValues>;
  errors: FieldErrors<ParentContactFormValues>;
  className?: string;
}

export function ParentContactFields({
  register,
  control,
  errors,
  className,
}: ParentContactFieldsProps) {
  return (
    <div className={className ?? "sm:col-span-2 grid gap-4 sm:grid-cols-2"}>
      <FormField
        label="Alternate contact person"
        error={errors.parentContactRelation}
        hint="Whose number is this? e.g. father, mother, guardian"
      >
        <Controller
          control={control}
          name="parentContactRelation"
          render={({ field }) => (
            <Select
              value={field.value || ""}
              onValueChange={(value) => field.onChange(value || "")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                {PARENT_CONTACT_RELATIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormField>
      <FormField
        label="Alternate contact number"
        error={errors.parentContact}
        hint="Optional — 10 digits"
      >
        <MobileInput {...register("parentContact", mobileFieldRules)} />
      </FormField>
    </div>
  );
}
