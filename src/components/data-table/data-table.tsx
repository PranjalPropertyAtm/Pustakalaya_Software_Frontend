import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type Row,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/common/EmptyState";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { BulkActionBar } from "./bulk-action-bar";
import { DataTablePagination } from "./data-table-pagination";
import { cn } from "@/lib/utils";
import type { DataTableServerState } from "./types";
import type { LucideIcon } from "lucide-react";

const MAX_PAGE_SIZE = 50;
const ROW_HEIGHT = 52;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  enableRowSelection?: boolean;
  enablePagination?: boolean;
  enableVirtualization?: boolean;
  pageSize?: number;
  serverPagination?: DataTableServerState;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  manualFiltering?: boolean;
  manualSorting?: boolean;
  stickyHeader?: boolean;
  stickyColumnIds?: string[];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  bulkActions?: { label: string; onClick: (rows: TData[]) => void; variant?: "default" | "outline" | "destructive" }[];
  onRowClick?: (row: TData) => void;
  className?: string;
  getRowId?: (row: TData) => string;
  toolbar?: (table: import("@tanstack/react-table").Table<TData>) => React.ReactNode;
}

interface DataTableRowProps<TData> {
  row: Row<TData>;
  stickyColumnIds: string[];
  onRowClick?: (row: TData) => void;
  style?: React.CSSProperties;
}

function DataTableRowInner<TData>({
  row,
  stickyColumnIds,
  onRowClick,
  style,
}: DataTableRowProps<TData>) {
  const handleClick = useCallback(() => {
    onRowClick?.(row.original);
  }, [onRowClick, row.original]);

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      className={cn(onRowClick && "cursor-pointer")}
      onClick={handleClick}
      style={style}
    >
      {row.getVisibleCells().map((cell) => {
        const sticky = stickyColumnIds.includes(cell.column.id);
        return (
          <TableCell
            key={cell.id}
            className={cn(
              sticky && "sticky left-0 z-10 bg-card shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;

function DataTableInner<TData, TValue>({
  columns,
  data,
  loading,
  enableRowSelection = false,
  enablePagination = true,
  enableVirtualization = false,
  pageSize = 20,
  serverPagination,
  globalFilter,
  manualFiltering,
  manualSorting,
  stickyHeader = true,
  stickyColumnIds = [],
  emptyIcon,
  emptyTitle = "No results",
  emptyDescription,
  bulkActions,
  onRowClick,
  className,
  getRowId,
  toolbar,
}: DataTableProps<TData, TValue>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [clientPagination, setClientPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: Math.min(pageSize, MAX_PAGE_SIZE),
  });

  const selectionColumn: ColumnDef<TData, unknown> = useMemo(
    () => ({
      id: "select",
      header: ({ table: t }) => (
        <Checkbox
          checked={t.getIsAllPageRowsSelected() || (t.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => t.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }),
    []
  );

  const tableColumns = useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [enableRowSelection, selectionColumn, columns]
  );

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination: serverPagination
        ? { pageIndex: serverPagination.pageIndex, pageSize: serverPagination.pageSize }
        : clientPagination,
    },
    enableRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: serverPagination
      ? (updater) => {
          const next =
            typeof updater === "function"
              ? updater({
                  pageIndex: serverPagination.pageIndex,
                  pageSize: serverPagination.pageSize,
                })
              : updater;
          serverPagination.onPaginationChange({
            pageIndex: next.pageIndex,
            pageSize: Math.min(next.pageSize, MAX_PAGE_SIZE),
          });
        }
      : (updater) => {
          setClientPagination((prev) => {
            const next = typeof updater === "function" ? updater(prev) : updater;
            return { ...next, pageSize: Math.min(next.pageSize, MAX_PAGE_SIZE) };
          });
        },
    onGlobalFilterChange: undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: serverPagination || !enablePagination ? undefined : getPaginationRowModel(),
    manualPagination: !!serverPagination,
    manualFiltering: !!manualFiltering,
    manualSorting: !!manualSorting,
    pageCount: serverPagination
      ? Math.ceil(serverPagination.totalRows / serverPagination.pageSize) || 1
      : undefined,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const rows = table.getRowModel().rows;
  const useVirtual = enableVirtualization && rows.length > 15;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    enabled: useVirtual,
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows.map((r) => r.original);
  const selectedCount = selectedRows.length;

  const bulkActionHandlers = useMemo(
    () =>
      bulkActions?.map((a) => ({
        label: a.label,
        variant: a.variant,
        onClick: () => a.onClick(selectedRows),
      })) ?? [],
    [bulkActions, selectedRows]
  );

  if (loading) {
    return <TableSkeleton columns={Math.min(columns.length, 8)} />;
  }

  const EmptyIcon = emptyIcon;

  return (
    <div className={cn("space-y-4", className)}>
      {toolbar?.(table)}
      {enableRowSelection && bulkActions && (
        <BulkActionBar
          selectedCount={selectedCount}
          onClear={() => table.resetRowSelection()}
          actions={bulkActionHandlers}
        />
      )}

      <div className="rounded-xl border border-border/80 bg-card shadow-card overflow-hidden">
        <div
          ref={scrollRef}
          className="relative max-h-[min(70vh,720px)] overflow-auto"
        >
          <Table>
            <TableHeader className={cn(stickyHeader && "sticky top-0 z-20 bg-card/95 backdrop-blur-sm")}>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="hover:bg-transparent">
                  {hg.headers.map((header) => {
                    const sticky = stickyColumnIds.includes(header.column.id);
                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          sticky && "sticky left-0 z-10 bg-card/95 backdrop-blur-sm shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]"
                        )}
                        style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              "flex items-center gap-1",
                              header.column.getCanSort() && "cursor-pointer select-none"
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                header.column.getToggleSortingHandler()?.(e);
                              }
                            }}
                            role={header.column.getCanSort() ? "button" : undefined}
                            tabIndex={header.column.getCanSort() ? 0 : undefined}
                            aria-label={
                              header.column.getCanSort()
                                ? `Sort by ${String(header.column.columnDef.header ?? header.column.id)}`
                                : undefined
                            }
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <span className="text-muted-foreground" aria-hidden>
                                {{
                                  asc: <ArrowUp className="h-3.5 w-3.5" />,
                                  desc: <ArrowDown className="h-3.5 w-3.5" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                                )}
                              </span>
                            )}
                          </div>
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="h-48">
                    {EmptyIcon ? (
                      <EmptyState icon={EmptyIcon} title={emptyTitle} description={emptyDescription} />
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">{emptyTitle}</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : useVirtual ? (
                <>
                  {virtualizer.getVirtualItems().length > 0 && (
                    <TableRow aria-hidden style={{ height: virtualizer.getVirtualItems()[0]?.start ?? 0 }}>
                      <TableCell colSpan={tableColumns.length} className="p-0 border-0" />
                    </TableRow>
                  )}
                  {virtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    return (
                      <DataTableRow
                        key={row.id}
                        row={row}
                        stickyColumnIds={stickyColumnIds}
                        onRowClick={onRowClick}
                      />
                    );
                  })}
                  {virtualizer.getVirtualItems().length > 0 && (
                    <TableRow
                      aria-hidden
                      style={{
                        height:
                          virtualizer.getTotalSize() -
                          (virtualizer.getVirtualItems().at(-1)?.end ?? 0),
                      }}
                    >
                      <TableCell colSpan={tableColumns.length} className="p-0 border-0" />
                    </TableRow>
                  )}
                </>
              ) : (
                rows.map((row) => (
                  <DataTableRow
                    key={row.id}
                    row={row}
                    stickyColumnIds={stickyColumnIds}
                    onRowClick={onRowClick}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {enablePagination && (
        <DataTablePagination
          table={table}
          totalRows={serverPagination?.totalRows}
        />
      )}
    </div>
  );
}

export const DataTable = memo(DataTableInner) as typeof DataTableInner;
