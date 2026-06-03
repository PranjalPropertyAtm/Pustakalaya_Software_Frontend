import * as React from "react";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { trimOnBlur } from "@/lib/inputHelpers";

const TRIM_TYPES = new Set(["text", "email", "search", "tel", "url", undefined]);

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onBlur, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        typography.input,
        typography.inputPlaceholder,
        className
      )}
      ref={ref}
      onBlur={(e) => {
        if (TRIM_TYPES.has(type) && type !== "password") {
          trimOnBlur(e, onBlur);
        } else {
          onBlur?.(e);
        }
      }}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
