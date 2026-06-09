import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  label?: string;
  activeCount?: number;
  children: React.ReactNode;
  className?: string;
  onClear?: () => void;
}

export function FilterDropdown({
  label = "Filters",
  activeCount = 0,
  children,
  className,
  onClear,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9 gap-2", className)}>
          <Filter className="h-3.5 w-3.5" />
          {label}
          {activeCount > 0 && (
            <span
              className={cn(
                "ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-primary-foreground",
                typography.badge
              )}
            >
              {activeCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="!flex w-[calc(100%-1.5rem)] max-w-md !flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby="filter-dialog-description"
      >
        <DialogHeader className="shrink-0 space-y-1 border-b border-border px-5 py-4 text-left">
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription id="filter-dialog-description">
            Refine the list using the options below.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {children}
        </div>

        <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-border px-5 py-4">
          {onClear ? (
            <Button type="button" variant="outline" onClick={onClear}>
              Clear filters
            </Button>
          ) : null}
          <Button type="button" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
