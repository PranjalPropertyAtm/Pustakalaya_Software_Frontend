import type { Table } from "@tanstack/react-table";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableSearch } from "./data-table-search";
import { DataTableColumnToggle } from "./data-table-column-toggle";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  onExport?: () => void;
  exportLabel?: string;
  className?: string;
}

export function DataTableToolbar<TData>({
  table,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filters,
  actions,
  onExport,
  exportLabel = "Export",
  className,
}: DataTableToolbarProps<TData>) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {onSearchChange && searchValue !== undefined && (
            <DataTableSearch
              value={searchValue}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="max-w-md"
            />
          )}
          {filters}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {onExport && (
            <Button variant="outline" size="sm" className="h-9 gap-2" onClick={onExport}>
              <Download className="h-3.5 w-3.5" />
              {exportLabel}
            </Button>
          )}
          <DataTableColumnToggle table={table} />
        </div>
      </div>
    </div>
  );
}
