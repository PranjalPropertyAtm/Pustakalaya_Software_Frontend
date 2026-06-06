import { useMemo, useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users, UserCheck, UserX, Clock } from "lucide-react";
import { studentsService, plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { listQueryOptions, staticQueryOptions } from "@/lib/queryDefaults";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/common/ErrorState";
import { StatsCard } from "@/components/shared/StatsCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import {
  DataTable,
  DataTableToolbar,
  DataTableFilters,
} from "@/components/data-table";
import { exportToCsv } from "@/lib/export";
import { getStudentId } from "@/lib/student";
import { getPlanId, getPlanLabel } from "@/lib/plan";
import { STUDENT_STATUSES } from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentColumns } from "@/features/students/student-table-columns";
import { toast } from "sonner";

type MembershipFilter = "all" | "active" | "inactive" | "expiring_soon";
type StatusFilter = "all" | (typeof STUDENT_STATUSES)[number];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { branchQuery } = useBranchContext();
  const columns = useStudentColumns();

  const [search, setSearch] = useState("");
  const [membership, setMembership] = useState<MembershipFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [planId, setPlanId] = useState("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "endDate" | "fullName">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ...branchQuery,
      limit: pageSize,
      page: pageIndex + 1,
      sortBy,
      sortOrder,
    };
    if (search.trim()) params.search = search.trim();
    if (planId !== "all") params.planId = planId;
    if (membership !== "all") {
      params.membership = membership;
      if (membership === "expiring_soon") params.expiringInDays = 7;
    } else if (status !== "all") {
      params.status = status;
    }
    return params;
  }, [branchQuery, search, planId, membership, status, sortBy, sortOrder, pageIndex, pageSize]);

  const { data: plansData } = useQuery({
    queryKey: queryKeys.plans.list({ isActive: "true" }),
    queryFn: () => plansService.list({ isActive: "true" }),
    ...staticQueryOptions,
  });

  const plans = plansData?.items ?? [];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.students.list(listParams),
    queryFn: () => studentsService.list(listParams),
    ...listQueryOptions,
  });

  const countParams = useMemo(
    () => (extra: Record<string, unknown> = {}) => ({
      ...branchQuery,
      ...extra,
      limit: 1,
      page: 1,
    }),
    [branchQuery]
  );

  const [totalSummary, activeSummary, dueSummary, expiringSummary] = useQueries({
    queries: [
      {
        queryKey: queryKeys.students.list(countParams()),
        queryFn: () => studentsService.list(countParams()),
        ...listQueryOptions,
      },
      {
        queryKey: queryKeys.students.list(countParams({ membership: "active" })),
        queryFn: () => studentsService.list(countParams({ membership: "active" })),
        ...listQueryOptions,
      },
      {
        queryKey: queryKeys.students.list(countParams({ membership: "inactive" })),
        queryFn: () => studentsService.list(countParams({ membership: "inactive" })),
        ...listQueryOptions,
      },
      {
        queryKey: queryKeys.students.list(
          countParams({ membership: "expiring_soon", expiringInDays: 7 })
        ),
        queryFn: () =>
          studentsService.list(countParams({ membership: "expiring_soon", expiringInDays: 7 })),
        ...listQueryOptions,
      },
    ],
  });

  const students = data?.items ?? [];
  const total = data?.pagination?.total ?? students.length;

  const summaryTotals = {
    total: totalSummary.data?.pagination?.total ?? 0,
    active: activeSummary.data?.pagination?.total ?? 0,
    due: dueSummary.data?.pagination?.total ?? 0,
    expiring: expiringSummary.data?.pagination?.total ?? 0,
  };

  const filterCount = [
    membership !== "all",
    status !== "all",
    planId !== "all",
    sortBy !== "createdAt" || sortOrder !== "desc",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setMembership("all");
    setStatus("all");
    setPlanId("all");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPageIndex(0);
  };

  const handleExport = async () => {
    if (students.length === 0) {
      toast.error("No rows to export");
      return;
    }
    await exportToCsv(
      students as unknown as Record<string, unknown>[],
      [
        { key: "studentCode", header: "Student ID" },
        { key: "fullName", header: "Name" },
        { key: "mobileNumber", header: "Mobile" },
        { key: "branch", header: "Branch", format: (r) => String((r as { branch?: { name?: string } }).branch?.name ?? "") },
        { key: "plan", header: "Plan", format: (r) => String((r as { plan?: { name?: string } }).plan?.name ?? "") },
        {
          key: "seat",
          header: "Seat no.",
          format: (r) => {
            const seat = (r as { seat?: { seatNumber?: string; label?: string } }).seat;
            return seat?.seatNumber ?? seat?.label ?? "";
          },
        },
        { key: "status", header: "Status" },
        { key: "startDate", header: "Start Date" },
        { key: "endDate", header: "End Date" },
      ],
      `students-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("Export started");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Students"
        description="Manage memberships, renewals, and seat assignments in one place"
        actions={
          <Button asChild className="shadow-sm">
            <Link to="/students/register">
              <Plus className="h-4 w-4" />
              Register student
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total students" value={summaryTotals.total} icon={Users} accent="primary" />
        <StatsCard title="Active" value={summaryTotals.active} icon={UserCheck} accent="secondary" />
        <StatsCard title="Renewal due" value={summaryTotals.due} icon={UserX} accent="neutral" />
        <StatsCard title="Expiring ≤7d" value={summaryTotals.expiring} icon={Clock} accent="neutral" />
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <SectionCard noPadding contentClassName="p-4">
          <DataTable
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchValue={search}
                onSearchChange={(v) => {
                  setSearch(v);
                  setPageIndex(0);
                }}
                searchPlaceholder="Search name, mobile, code…"
                onExport={handleExport}
                filters={
                  <DataTableFilters>
                    <FilterDropdown label="Filters" activeCount={filterCount}>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Membership</Label>
                          <Select
                            value={membership}
                            onValueChange={(v) => {
                              setMembership(v as MembershipFilter);
                              if (v !== "all") setStatus("all");
                              setPageIndex(0);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="active">Active only</SelectItem>
                              <SelectItem value="inactive">Period ended</SelectItem>
                              <SelectItem value="expiring_soon">Expiring in 7 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Plan</Label>
                          <Select
                            value={planId}
                            onValueChange={(v) => {
                              setPlanId(v);
                              setPageIndex(0);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="All plans" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All plans</SelectItem>
                              {plans.map((plan) => {
                                const id = getPlanId(plan);
                                return (
                                  <SelectItem key={id} value={id}>
                                    {getPlanLabel(plan)}
                                    {plan.durationHours != null && ` (${plan.durationHours}h)`}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Status</Label>
                          <Select
                            value={status}
                            onValueChange={(v) => {
                              setStatus(v as StatusFilter);
                              if (v !== "all") setMembership("all");
                              setPageIndex(0);
                            }}
                            disabled={membership !== "all"}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Any</SelectItem>
                              {STUDENT_STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Sort</Label>
                            <Select
                              value={sortBy}
                              onValueChange={(v) => setSortBy(v as typeof sortBy)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="endDate">End date</SelectItem>
                                <SelectItem value="fullName">Name</SelectItem>
                                <SelectItem value="createdAt">Registered</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Order</Label>
                            <Select
                              value={sortOrder}
                              onValueChange={(v) => setSortOrder(v as "asc" | "desc")}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asc">Asc</SelectItem>
                                <SelectItem value="desc">Desc</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </div>
                    </FilterDropdown>
                  </DataTableFilters>
                }
              />
            )}
            columns={columns}
            data={students}
            loading={isLoading}
            enableRowSelection
            enablePagination
            enableVirtualization
            manualFiltering
            stickyHeader
            stickyColumnIds={["photo", "actions"]}
            getRowId={(row) => getStudentId(row)}
            onRowClick={(row) => navigate(`/students/${getStudentId(row)}`)}
            emptyIcon={Users}
            emptyTitle="No students found"
            emptyDescription="Try different filters or register a new student."
            serverPagination={{
              pageIndex,
              pageSize,
              totalRows: total,
              onPaginationChange: ({ pageIndex: pi, pageSize: ps }) => {
                setPageIndex(pi);
                setPageSize(ps);
              },
            }}
            bulkActions={[
              {
                label: "Export selected",
                onClick: async (rows) => {
                  if (rows.length === 0) return;
                  await exportToCsv(
                    rows as unknown as Record<string, unknown>[],
                    [
                      { key: "studentCode", header: "Student ID" },
                      { key: "fullName", header: "Name" },
                      { key: "mobileNumber", header: "Mobile" },
                      { key: "status", header: "Status" },
                    ],
                    `students-selected.csv`
                  );
                },
              },
            ]}
          />
      </SectionCard>
    </div>
  );
}
