export type ExportColumn<T extends Record<string, unknown>> = {
  key: keyof T | string;
  header: string;
  format?: (row: T) => string;
};

export type TableExportFormat = "csv" | "xlsx";
