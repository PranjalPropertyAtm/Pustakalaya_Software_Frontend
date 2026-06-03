import type { ExportColumn } from "./types";

/** Export tabular rows to a CSV file download (client-side). */
export function exportToCsv<T extends Record<string, unknown>>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename = "export.csv"
) {
  if (rows.length === 0) return;

  const escape = (val: string) => {
    const s = String(val ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = columns.map((c) => escape(c.header)).join(",");
  const bodyLines = rows.map((row) =>
    columns
      .map((c) => {
        const raw = c.format ? c.format(row) : String(row[c.key as keyof T] ?? "");
        return escape(raw);
      })
      .join(",")
  );

  const csv = [headerLine, ...bodyLines].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
