import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, History, Users } from "lucide-react";
import { renewalsService, studentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ApiClientError } from "@/api/client";
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
import { formatDate } from "@/lib/utils";
import type { Renewal } from "@/types/domain";
import { toast } from "sonner";

const HISTORY_STATUSES = new Set(["completed", "cancelled"]);
const PENDING_RENEWAL_STATUSES = new Set(["pending", "partial"]);

export default function RenewalsPage() {
  const queryClient = useQueryClient();
  const { branchQuery, requiresBranchSelection } = useBranchContext();
  const [tab, setTab] = useState("due");
  const [cancelRenewalId, setCancelRenewalId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [historyStatus, setHistoryStatus] = useState<string>("all");
  const [dueTypeFilter, setDueTypeFilter] = useState<"all" | "expiring" | "overdue">("all");

  const listEnabled = !requiresBranchSelection;

  const renewalListParams = useMemo(
    () => ({
      ...branchQuery,
      limit: 100,
      ...(dateFrom ? { from: dateFrom } : {}),
      ...(dateTo ? { to: dateTo } : {}),
      ...(historyStatus !== "all" ? { status: historyStatus } : {}),
    }),
    [branchQuery, dateFrom, dateTo, historyStatus]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.renewals.list(renewalListParams),
    queryFn: () => renewalsService.list(renewalListParams),
    enabled: listEnabled && tab === "history",
  });

  const overdueQuery = useQuery({
    queryKey: queryKeys.students.list({
      ...branchQuery,
      membership: "overdue",
      limit: 100,
      sortBy: "endDate",
      sortOrder: "asc",
    }),
    queryFn: () =>
      studentsService.list({
        ...branchQuery,
        membership: "overdue",
        limit: 100,
        sortBy: "endDate",
        sortOrder: "asc",
      }),
    enabled: listEnabled,
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

  const pendingRenewalsQuery = useQuery({
    queryKey: queryKeys.renewals.list({ ...branchQuery, limit: 100, scope: "pending" }),
    queryFn: () => renewalsService.list({ ...branchQuery, limit: 100 }),
    enabled: listEnabled,
  });

  const cancelRenewalMutation = useMutation({
    mutationFn: (renewalId: string) => renewalsService.cancel(renewalId),
    onSuccess: () => {
      toast.success("Renewal cancelled");
      setCancelRenewalId(null);
      void queryClient.invalidateQueries({ queryKey: ["renewals"], exact: false });
      void queryClient.invalidateQueries({ queryKey: ["students"], exact: false });
    },
    onError: (err) => {
      toast.error(err instanceof ApiClientError ? err.message : "Could not cancel renewal");
    },
  });

  const renewals = data?.items ?? [];
  const historyRenewals = useMemo(
    () => renewals.filter((r) => HISTORY_STATUSES.has(r.status)),
    [renewals]
  );

  const expiringStudents = expiringQuery.data?.items ?? [];
  const overdueStudents = overdueQuery.data?.items ?? [];

  const expiringIds = useMemo(
    () => new Set(expiringStudents.map((s) => getStudentId(s))),
    [expiringStudents]
  );

  const overdueOnlyStudents = useMemo(
    () => overdueStudents.filter((s) => !expiringIds.has(getStudentId(s))),
    [overdueStudents, expiringIds]
  );

  const pendingRenewalByStudentId = useMemo(() => {
    const map = new Map<string, Renewal>();
    for (const renewal of pendingRenewalsQuery.data?.items ?? []) {
      if (!PENDING_RENEWAL_STATUSES.has(renewal.status)) continue;
      map.set(String(renewal.studentId), renewal);
    }
    return map;
  }, [pendingRenewalsQuery.data]);

  const dueRows: DueStudentRow[] = useMemo(() => {
    const rows: DueStudentRow[] = [
      ...overdueOnlyStudents.map((s) => ({ ...s, dueType: "overdue" as const })),
      ...expiringStudents.map((s) => ({ ...s, dueType: "expiring" as const })),
    ];
    if (dueTypeFilter === "expiring") return rows.filter((r) => r.dueType === "expiring");
    if (dueTypeFilter === "overdue") return rows.filter((r) => r.dueType === "overdue");
    return rows;
  }, [expiringStudents, overdueOnlyStudents, dueTypeFilter]);

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

  const renewalColumns = useMemo(
    () =>
      getRenewalColumns({
        onCollectPayment: () => {},
        onCancel: () => {},
      }),
    []
  );

  const dueColumns = useMemo(
    () =>
      getDueStudentColumns({
        pendingRenewalByStudentId,
        onCancelRenewal: (renewal) => setCancelRenewalId(getRenewalId(renewal)),
        cancelingRenewalId: cancelRenewalMutation.isPending ? cancelRenewalId : null,
      }),
    [pendingRenewalByStudentId, cancelRenewalMutation.isPending, cancelRenewalId]
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

  const dueLoading = overdueQuery.isLoading || expiringQuery.isLoading;
  const dueError = overdueQuery.isError || expiringQuery.isError;

  if (requiresBranchSelection) {
    return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Renewals"
        description="Track overdue memberships and renewal history"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="due" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Due for renewal
            {overdueOnlyStudents.length > 0 && (
              <span className="ml-1 rounded-full bg-destructive/15 px-1.5 text-xs font-medium text-destructive">
                {overdueOnlyStudents.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-3.5 w-3.5" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="due" className="mt-4 space-y-4">
          {dueError && (
            <ErrorState
              onRetry={() => {
                overdueQuery.refetch();
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
              emptyDescription="Overdue or expiring students will appear here."
              toolbar={(table) => (
                <DataTableToolbar
                  table={table}
                  searchValue={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Search name, code, mobile…"
                  onExport={exportDue}
                  filters={
                    <DataTableFilters>
                      <FilterDropdown
                        label="Filters"
                        activeCount={dueFilterCount}
                        onClear={clearDueFilters}
                      >
                        <div className="space-y-1.5">
                          <Label className="text-xs">Due type</Label>
                          <Select
                            value={dueTypeFilter}
                            onValueChange={(v) =>
                              setDueTypeFilter(v as "all" | "expiring" | "overdue")
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="overdue">Overdue</SelectItem>
                              <SelectItem value="expiring">Expiring soon</SelectItem>
                            </SelectContent>
                          </Select>
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
                      <FilterDropdown
                        label="Filters"
                        activeCount={renewalFilterCount}
                        onClear={clearRenewalFilters}
                      >
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
                        </div>
                      </FilterDropdown>
                    </DataTableFilters>
                  }
                />
              )}
            />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={Boolean(cancelRenewalId)}
        onOpenChange={(open) => {
          if (!open && !cancelRenewalMutation.isPending) setCancelRenewalId(null);
        }}
        title="Cancel renewal"
        description="This pending renewal will be cancelled. You can start a new renewal for the student later."
        confirmLabel="Cancel renewal"
        variant="destructive"
        loading={cancelRenewalMutation.isPending}
        onConfirm={() => {
          if (cancelRenewalId) cancelRenewalMutation.mutate(cancelRenewalId);
        }}
      />
    </div>
  );
}
