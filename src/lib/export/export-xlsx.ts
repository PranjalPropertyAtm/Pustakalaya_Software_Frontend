import type { ExportColumn } from "./types";

/** Lazy-loaded XLSX export — only loads sheetjs when invoked. */
export async function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename = "export.xlsx"
) {
  if (rows.length === 0) return;

  const XLSX = await import("xlsx");

  const sheetRows = rows.map((row) => {
    const record: Record<string, string> = {};
    for (const col of columns) {
      record[col.header] = col.format ? col.format(row) : String(row[col.key as keyof T] ?? "");
    }
    return record;
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Export");
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
