import type { FieldError } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}

export function FormField({ label, error, required, children, className, hint }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className={typography.formHint}>{hint}</p>}
      {error && <p className={typography.formError}>{error.message}</p>}
    </div>
  );
}
