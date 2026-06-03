import type { ExportColumn, TableExportFormat } from "./types";

export type { ExportColumn, TableExportFormat } from "./types";

/** Dynamically loads CSV export module (kept out of initial bundle). */
export async function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename?: string
) {
  const { exportToCsv: run } = await import("./export-csv");
  run(rows, columns, filename);
}

/** Dynamically loads XLSX export module. */
export async function exportToXlsx<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename?: string
) {
  const { exportToXlsx: run } = await import("./export-xlsx");
  await run(rows, columns, filename);
}

/** Dynamically loads PDF export modules (html2canvas + jsPDF). */
export async function exportElementToPdf(element: HTMLElement, filename?: string) {
  const { exportElementToPdf: run } = await import("./export-pdf");
  await run(element, filename);
}

export async function exportHtmlToPdf(html: string, filename?: string) {
  const { exportHtmlToPdf: run } = await import("./export-pdf");
  await run(html, filename);
}

/** Unified table export entry — format selects lazy chunk. */
export async function exportTableData<T extends Record<string, unknown>>(
  format: TableExportFormat,
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  if (format === "csv") {
    await exportToCsv(rows, columns, filename);
    return;
  }
  await exportToXlsx(rows, columns, filename);
}
