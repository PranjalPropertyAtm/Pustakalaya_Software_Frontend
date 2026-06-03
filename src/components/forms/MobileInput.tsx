import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { digitsOnly, MOBILE_LENGTH } from "@/lib/inputHelpers";

type MobileInputProps = React.ComponentProps<typeof Input>;

export const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, onChange, maxLength = MOBILE_LENGTH, ...props }, ref) => (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      maxLength={maxLength}
      placeholder={props.placeholder ?? "9876543210"}
      className={cn(className)}
      onChange={(e) => {
        e.target.value = digitsOnly(e.target.value, MOBILE_LENGTH);
        onChange?.(e);
      }}
      {...props}
    />
  )
);
MobileInput.displayName = "MobileInput";
