/** Slot wrapper for filter controls in the toolbar. */
export function DataTableFilters({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end gap-2">{children}</div>;
}
