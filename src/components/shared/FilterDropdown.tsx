import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";

interface FilterDropdownProps {
  label?: string;
  activeCount?: number;
  children: React.ReactNode;
  className?: string;
}

export function FilterDropdown({
  label = "Filters",
  activeCount = 0,
  children,
  className,
}: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={cn("h-9 gap-2", className)}>
          <Filter className="h-3.5 w-3.5" />
          {label}
          {activeCount > 0 && (
            <span className={cn("ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-primary-foreground", typography.badge)}>
              {activeCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-2 p-1">{children}</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
