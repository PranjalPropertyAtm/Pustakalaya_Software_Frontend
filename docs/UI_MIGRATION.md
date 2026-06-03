# Pustakalaya UI Upgrade — Architecture & Migration Guide

This document describes the incremental SaaS UI refactor. **Business logic, APIs, routes, and backend integrations are unchanged.**

## New folder structure

```
src/
├── components/
│   ├── data-table/          # Enterprise DataTable (TanStack Table)
│   ├── shared/              # Premium reusable UI (StatsCard, SectionCard, …)
│   ├── common/              # Legacy shared (PageHeader, EmptyState — upgraded in place)
│   ├── layout/              # AppShell, Sidebar, Header, Breadcrumbs, UserMenu
│   ├── ui/                  # shadcn primitives (+ table, checkbox, avatar)
│   └── …feature folders
├── features/
│   └── */ *-table-columns.tsx   # Column defs per domain (students, payments, …)
├── stores/
│   └── uiStore.ts           # Sidebar collapse (persisted)
└── lib/
    └── export-csv.ts        # Client-side CSV export
```

## DataTable system

**Location:** `@/components/data-table`

| Component | Purpose |
|-----------|---------|
| `DataTable` | Core grid: sort, filter, pagination, selection, sticky header, server pagination |
| `DataTableToolbar` | Search, filters slot, export, column toggle |
| `DataTablePagination` | Page size + navigation |
| `DataTableSearch` | Re-export of `SearchInput` |
| `DataTableFilters` | Filter row wrapper |
| `DataTableColumnToggle` | Show/hide columns |
| `RowActionMenu` | Per-row ⋯ menu |
| `BulkActionBar` | Selection actions |
| `TableSkeleton` | Loading state |

### Usage pattern

```tsx
<DataTable
  columns={columns}
  data={rows}
  loading={isLoading}
  enableRowSelection
  serverPagination={{ pageIndex, pageSize, totalRows, onPaginationChange }}
  toolbar={(table) => (
    <DataTableToolbar table={table} searchValue={q} onSearchChange={setQ} onExport={exportCsv} />
  )}
/>
```

Define columns in `features/<domain>/<domain>-table-columns.tsx`.

## Shared UI system

**Location:** `@/components/shared`

- `StatsCard` — KPI cards with gradient accents
- `SectionCard` — Panel sections for tables/forms
- `StatusBadge` — Consistent status tones
- `DashboardCard` — Chart containers
- `SearchInput`, `FilterDropdown`, `ConfirmDialog`, `TableSkeleton`

`StatCard` in `@/components/dashboard` now wraps `StatsCard` for backward compatibility.

## Migration status

| Area | Status | Notes |
|------|--------|-------|
| Global theme (`index.css`) | Done | Slate palette, shadows, surfaces |
| Sidebar / Header | Done | Collapsible, breadcrumbs, user menu |
| Students | Done | Full DataTable + stats + export |
| Payments | Done | DataTable on History tab |
| Dashboard | Done | Recharts + KPI cards |
| Seat map | Done | Zoom, colors, summary cards |
| Renewals | Pending | Still card list — migrate next |
| Plans | Pending | Card grid OK for catalog; optional table for admin |
| Branches | Pending | Card grid — optional table view |
| Counsellors | Pending | Card list |
| Notifications | Pending | `NotificationList` |
| Reports | Pending | Enhance with charts from API |
| Forms | Partial | Existing RHF + zod; multi-step later |

## Incremental next steps

1. **Renewals** — Add `renewal-table-columns.tsx`; replace `RenewalCard` lists in each tab.
2. **Notifications** — Table with read/unread filters + bulk mark read.
3. **Branches / Counsellors** — Toggle “Cards / Table” or table-only for super-admin.
4. **Reports** — Replace raw JSON tab with chart components wired to `reportsService`.
5. **Forms** — Introduce `FormStepper` for registration; enhance `FileUploadField` previews.
6. **Performance** — Code-split Recharts on dashboard only (already lazy route); memoize column defs with `useMemo`.

## Dependencies added

- `@tanstack/react-table`
- `recharts`

## Conventions

- Keep API hooks (`useQuery`, services) in pages; columns stay presentational.
- Use `exportToCsv` from `@/lib/export-csv` for exports.
- Prefer `StatusBadge` + `statusToneFromValue` over ad-hoc badge logic.
- Sticky action column: pass `stickyColumnIds={["actions"]}` (extend DataTable for `stickyRight` if needed).

## Testing checklist

- [ ] Login / branch selection / role-based nav
- [ ] Students: search, filters, pagination, export, row actions, bulk export
- [ ] Payments: collect flow + history table
- [ ] Dashboard: branch vs super-admin views
- [ ] Seat map: plan/shift filters, zoom, colors
- [ ] Mobile sidebar overlay + collapsed desktop sidebar
