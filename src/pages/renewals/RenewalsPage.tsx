import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Clock, History, Users } from "lucide-react";
import { renewalsService, studentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorState } from "@/components/common/ErrorState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { TableDateRangeFilter } from "@/components/shared/TableDateRangeFilter";
import {
  DataTable,
  DataTableToolbar,
  DataTableFilters,
} from "@/components/data-table";
import { getRenewalColumns } from "@/features/renewals/renewal-table-columns";
import {
  getDueStudentColumns,
  type DueStudentRow,
} from "@/features/renewals/due-student-table-columns";
import { getRenewalId, RENEWAL_STATUSES } from "@/lib/renewal";
import { getStudentId } from "@/lib/student";
import { isWithinDateRange } from "@/lib/dateRange";
import { exportToCsv } from "@/lib/export";
import { formatNotificationLabel } from "@/lib/notification";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEFAULT_CURRENCY } from "@/lib/constants";
import type { Renewal } from "@/types/domain";
import { toast } from "sonner";

const OPEN_STATUSES = new Set(["pending", "partial"]);
const HISTORY_STATUSES = new Set(["completed", "cancelled"]);

export default function RenewalsPage() {
  const { branchQuery, requiresBranchSelection } = useBranchContext();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("open");
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [historyStatus, setHistoryStatus] = useState<string>("all");
  const [dueTypeFilter, setDueTypeFilter] = useState<"all" | "expiring" | "inactive">("all");

  const listEnabled = !requiresBranchSelection;

  const renewalListParams = useMemo(
    () => ({
      ...branchQuery,
      limit: 100,
      ...(dateFrom ? { from: dateFrom } : {}),
      ...(dateTo ? { to: dateTo } : {}),
      ...(tab === "history" && historyStatus !== "all" ? { status: historyStatus } : {}),
    }),
    [branchQuery, dateFrom, dateTo, tab, historyStatus]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.renewals.list(renewalListParams),
    queryFn: () => renewalsService.list(renewalListParams),
    enabled: listEnabled && (tab === "open" || tab === "history"),
  });

  const inactiveQuery = useQuery({
    queryKey: queryKeys.students.list({
      ...branchQuery,
      membership: "inactive",
      limit: 100,
      sortBy: "endDate",
      sortOrder: "asc",
    }),
    queryFn: () =>
      studentsService.list({
        ...branchQuery,
        membership: "inactive",
        limit: 100,
        sortBy: "endDate",
        sortOrder: "asc",
      }),
    enabled: listEnabled && tab === "due",
  });

  const expiringQuery = useQuery({
    queryKey: queryKeys.students.list({
      ...branchQuery,
      membership: "expiring_soon",
      expiringInDays: 30,
      limit: 100,
      sortBy: "endDate",
      sortOrder: "asc",
    }),
    queryFn: () =>
      studentsService.list({
        ...branchQuery,
        membership: "expiring_soon",
        expiringInDays: 30,
        limit: 100,
        sortBy: "endDate",
        sortOrder: "asc",
      }),
    enabled: listEnabled && tab === "due",
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => renewalsService.cancel(id),
    onSuccess: () => {
      toast.success("Renewal cancelled");
      queryClient.invalidateQueries({ queryKey: ["renewals"], exact: false });
    },
    onError: (err: Error) => toast.error(err.message || "Could not cancel renewal"),
  });

  const renewals = data?.items ?? [];
  const openRenewals = useMemo(
    () => renewals.filter((r) => OPEN_STATUSES.has(r.status)),
    [renewals]
  );
  const historyRenewals = useMemo(
    () => renewals.filter((r) => HISTORY_STATUSES.has(r.status)),
    [renewals]
  );
  const openStudentIds = useMemo(
    () => new Set(openRenewals.map((r) => String(r.studentId))),
    [openRenewals]
  );

  const expiringStudents = expiringQuery.data?.items ?? [];
  const inactiveStudents = inactiveQuery.data?.items ?? [];

  const expiringIds = useMemo(
    () => new Set(expiringStudents.map((s) => getStudentId(s))),
    [expiringStudents]
  );

  const inactiveOnlyStudents = useMemo(
    () => inactiveStudents.filter((s) => !expiringIds.has(getStudentId(s))),
    [inactiveStudents, expiringIds]
  );

  const dueRows: DueStudentRow[] = useMemo(() => {
    const rows: DueStudentRow[] = [
      ...expiringStudents.map((s) => ({ ...s, dueType: "expiring" as const })),
      ...inactiveOnlyStudents.map((s) => ({ ...s, dueType: "inactive" as const })),
    ];
    if (dueTypeFilter === "expiring") return rows.filter((r) => r.dueType === "expiring");
    if (dueTypeFilter === "inactive") return rows.filter((r) => r.dueType === "inactive");
    return rows;
  }, [expiringStudents, inactiveOnlyStudents, dueTypeFilter]);

  const filterRenewals = useMemo(
    () => (rows: Renewal[]) => {
      let list = rows;
      if (dateFrom || dateTo) {
        list = list.filter((r) => isWithinDateRange(r.createdAt, dateFrom, dateTo));
      }
      if (!search.trim()) return list;
      const q = search.toLowerCase();
      return list.filter(
        (r) =>
          r.renewalNumber?.toLowerCase().includes(q) ||
          r.student?.fullName?.toLowerCase().includes(q) ||
          r.student?.studentCode?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q)
      );
    },
    [search, dateFrom, dateTo]
  );

  const filteredOpen = useMemo(
    () => filterRenewals(openRenewals),
    [openRenewals, filterRenewals]
  );
  const filteredHistory = useMemo(
    () => filterRenewals(historyRenewals),
    [historyRenewals, filterRenewals]
  );

  const filteredDueRows = useMemo(() => {
    if (!search.trim()) return dueRows;
    const q = search.toLowerCase();
    return dueRows.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode?.toLowerCase().includes(q) ||
        s.mobileNumber?.includes(q)
    );
  }, [dueRows, search]);

  const goToCollect = useCallback(
    (r: Renewal) => {
      const id = getRenewalId(r);
      const studentId = String(r.studentId);
      navigate(
        `/payments?tab=collect&studentId=${encodeURIComponent(studentId)}&renewalId=${encodeURIComponent(id)}`
      );
    },
    [navigate]
  );

  const renewalColumns = useMemo(
    () =>
      getRenewalColumns({
        onCollectPayment: goToCollect,
        onCancel: (id) => cancelMutation.mutate(id),
      }),
    [goToCollect, cancelMutation]
  );

  const dueColumns = useMemo(
    () =>
      getDueStudentColumns({
        openStudentIds,
        onRenewalStarted: () => setTab("open"),
      }),
    [openStudentIds]
  );

  const renewalFilterCount = [Boolean(dateFrom), Boolean(dateTo), historyStatus !== "all"].filter(
    Boolean
  ).length;
  const dueFilterCount = dueTypeFilter !== "all" ? 1 : 0;

  const clearRenewalFilters = () => {
    setDateFrom("");
    setDateTo("");
    setHistoryStatus("all");
    setSearch("");
  };

  const clearDueFilters = () => {
    setDueTypeFilter("all");
    setSearch("");
  };

  const exportRenewals = async (rows: Renewal[], filename: string) => {
    if (rows.length === 0) {
      toast.error("No rows to export");
      return;
    }
    await exportToCsv(
      rows as unknown as Record<string, unknown>[],
      [
        { key: "createdAt", header: "Date", format: (r) => formatDate(String((r as unknown as Renewal).createdAt)) },
        { key: "renewalNumber", header: "Renewal #" },
        {
          key: "student",
          header: "Student",
          format: (r) => String((r as unknown as Renewal).student?.fullName ?? ""),
        },
        {
          key: "amountPaid",
          header: "Paid",
          format: (r) => {
            const row = r as unknown as Renewal;
            return formatCurrency(row.amountPaid ?? 0, row.currency ?? DEFAULT_CURRENCY);
          },
        },
        { key: "status", header: "Status" },
      ],
      filename
    );
    toast.success("Export started");
  };

  const exportDue = async () => {
    if (filteredDueRows.length === 0) {
      toast.error("No rows to export");
      return;
    }
    await exportToCsv(
      filteredDueRows as unknown as Record<string, unknown>[],
      [
        { key: "endDate", header: "End date", format: (r) => formatDate(String((r as unknown as DueStudentRow).endDate)) },
        { key: "fullName", header: "Name" },
        { key: "studentCode", header: "Code" },
        { key: "mobileNumber", header: "Mobile" },
        { key: "dueType", header: "Due type" },
        { key: "status", header: "Status" },
      ],
      `renewals-due-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("Export started");
  };

  const dueLoading = inactiveQuery.isLoading || expiringQuery.isLoading;
  const dueError = inactiveQuery.isError || expiringQuery.isError;

  if (requiresBranchSelection) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Renewals"
        description="Sort and filter renewals by date, status, and student"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="open" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Open
            {openRenewals.length > 0 && (
              <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-xs font-medium text-primary">
                {openRenewals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="due" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Due for renewal
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4 space-y-4">
          {isError && <ErrorState onRetry={refetch} />}
          <DataTable
              columns={renewalColumns}
              data={filteredOpen}
              loading={isLoading}
              enablePagination
              pageSize={15}
              stickyHeader
              stickyColumnIds={["actions"]}
              getRowId={(row) => getRenewalId(row)}
              onRowClick={goToCollect}
              emptyIcon={RefreshCw}
              emptyTitle="No open renewals"
              emptyDescription="Start a renewal from the Due tab, then collect payment here or from Payments."
              toolbar={(table) => (
                <DataTableToolbar
                  table={table}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search renewal #, student, status…"
                  onExport={() =>
                    exportRenewals(filteredOpen, `renewals-open-${new Date().toISOString().slice(0, 10)}.csv`)
                  }
                  filters={
                    <DataTableFilters>
                      <FilterDropdown label="Filters" activeCount={renewalFilterCount}>
                        <div className="space-y-3">
                          <TableDateRangeFilter
                            from={dateFrom}
                            to={dateTo}
                            onFromChange={setDateFrom}
                            onToChange={setDateTo}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={clearRenewalFilters}
                          >
                            Clear filters
                          </Button>
                        </div>
                      </FilterDropdown>
                    </DataTableFilters>
                  }
                />
              )}
            />
        </TabsContent>

        <TabsContent value="due" className="mt-4 space-y-4">
          {dueError && (
            <ErrorState
              onRetry={() => {
                inactiveQuery.refetch();
                expiringQuery.refetch();
              }}
            />
          )}
          <DataTable
              columns={dueColumns}
              data={filteredDueRows}
              loading={dueLoading}
              enablePagination
              pageSize={15}
              stickyHeader
              getRowId={(row) => getStudentId(row)}
              emptyIcon={Users}
              emptyTitle="No memberships due"
              emptyDescription="Inactive or expiring students will appear here."
              toolbar={(table) => (
                <DataTableToolbar
                  table={table}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search name, code, mobile…"
                  onExport={exportDue}
                  filters={
                    <DataTableFilters>
                      <FilterDropdown label="Filters" activeCount={dueFilterCount}>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Due type</Label>
                            <Select
                              value={dueTypeFilter}
                              onValueChange={(v) =>
                                setDueTypeFilter(v as "all" | "expiring" | "inactive")
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="expiring">Expiring soon</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={clearDueFilters}
                          >
                            Clear filters
                          </Button>
                        </div>
                      </FilterDropdown>
                    </DataTableFilters>
                  }
                />
              )}
            />
        </TabsContent>

        <TabsContent value="history" className="mt-4 space-y-4">
          {isError && <ErrorState onRetry={refetch} />}
          <DataTable
              columns={renewalColumns}
              data={filteredHistory}
              loading={isLoading}
              enablePagination
              pageSize={15}
              stickyHeader
              getRowId={(row) => getRenewalId(row)}
              emptyIcon={History}
              emptyTitle="No renewal history"
              emptyDescription="Completed and cancelled renewals will appear here."
              toolbar={(table) => (
                <DataTableToolbar
                  table={table}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search renewal #, student…"
                  onExport={() =>
                    exportRenewals(
                      filteredHistory,
                      `renewals-history-${new Date().toISOString().slice(0, 10)}.csv`
                    )
                  }
                  filters={
                    <DataTableFilters>
                      <FilterDropdown label="Filters" activeCount={renewalFilterCount}>
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Status</Label>
                            <Select value={historyStatus} onValueChange={setHistoryStatus}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All completed / cancelled</SelectItem>
                                {RENEWAL_STATUSES.filter((s) => HISTORY_STATUSES.has(s)).map(
                                  (s) => (
                                    <SelectItem key={s} value={s}>
                                      {formatNotificationLabel(s)}
                                    </SelectItem>
                                  )
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          <TableDateRangeFilter
                            from={dateFrom}
                            to={dateTo}
                            onFromChange={setDateFrom}
                            onToChange={setDateTo}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full"
                            onClick={clearRenewalFilters}
                          >
                            Clear filters
                          </Button>
                        </div>
                      </FilterDropdown>
                    </DataTableFilters>
                  }
                />
              )}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
