import * as React from "react";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { trimOnBlur } from "@/lib/inputHelpers";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, onBlur, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-border bg-card px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        typography.input,
        typography.inputPlaceholder,
        className
      )}
      ref={ref}
      onBlur={(e) => trimOnBlur(e, onBlur)}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
