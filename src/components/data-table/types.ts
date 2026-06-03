import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

export type { ColumnDef, ColumnFiltersState, PaginationState, RowSelectionState, SortingState, VisibilityState };

export interface DataTableServerState {
  pageIndex: number;
  pageSize: number;
  totalRows: number;
  onPaginationChange: (pagination: PaginationState) => void;
}

export interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
