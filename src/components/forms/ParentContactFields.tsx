import { useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Controller } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { MobileInput } from "@/components/forms/MobileInput";
import { Input } from "@/components/ui/input";
import { mobileFieldRules, trimmedFieldRules } from "@/lib/inputHelpers";
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
  parentContactName?: string;
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
  const relation = useWatch({ control, name: "parentContactRelation" });

  return (
    <div className={className ?? "sm:col-span-2 space-y-4 rounded-md border border-border/80 bg-muted/20 p-3"}>
      <p className="text-sm font-medium">Alternate contact (optional)</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Relation"
          error={errors.parentContactRelation}
          hint="Who is this person to the student?"
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
        {relation ? (
          <FormField
            label="Their name"
            error={errors.parentContactName}
            required
            hint="Full name of the contact person"
          >
            <Input {...register("parentContactName", trimmedFieldRules)} placeholder="e.g. Rajesh Kumar" />
          </FormField>
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}
        <FormField
          label="Contact number"
          error={errors.parentContact}
          className={relation ? "" : "sm:col-span-2"}
          hint={relation ? "10-digit mobile number" : "Select relation first to add a contact"}
        >
          <MobileInput
            {...register("parentContact", mobileFieldRules)}
            disabled={!relation}
          />
        </FormField>
      </div>
    </div>
  );
}
