import { useMemo } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Users, UserCheck, UserX, Clock } from "lucide-react";
import { studentsService, plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { useStudentsListUrlState } from "@/hooks/useStudentsListUrlState";
import { listQueryOptions, staticQueryOptions } from "@/lib/queryDefaults";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/common/ErrorState";
import { StatsCard } from "@/components/shared/StatsCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { TableDateRangeFilter } from "@/components/shared/TableDateRangeFilter";
import {
  DataTable,
  DataTableToolbar,
  DataTableFilters,
} from "@/components/data-table";
import { exportToCsv } from "@/lib/export";
import { getStudentId, getEnrollmentTypeLabel } from "@/lib/student";
import { getPlanId, getPlanLabel } from "@/lib/plan";
import { formatDate } from "@/lib/utils";
import { STUDENT_STATUSES, STUDENT_TYPE_FILTERS } from "@/lib/constants";
import { studentTypeToListParams, membershipToListParams, DEFAULT_STUDENTS_LIST_URL_STATE, type StudentsMembershipFilter } from "@/lib/studentsListUrl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStudentColumns } from "@/features/students/student-table-columns";
import type { StudentRenewalSummary } from "@/types/domain";
import { studentRenewalExportValue } from "@/lib/studentRenewal";
import { toast } from "sonner";
import type { StudentsDateField } from "@/lib/studentsListUrl";

const STUDENT_DATE_FIELD_LABELS: Record<StudentsDateField, string> = {
  joiningDate: "Joining date",
  createdAt: "Registered on",
  startDate: "Membership start",
  endDate: "Membership end",
};

export default function StudentsPage() {
  const navigate = useNavigate();
  const { branchQuery } = useBranchContext();
  const {
    search,
    status,
    studentType,
    membership,
    planId,
    dateField,
    dateFrom,
    dateTo,
    sortBy,
    sortOrder,
    pageIndex,
    pageSize,
    listSearch,
    patchState,
    clearFilters,
  } = useStudentsListUrlState();
  const columns = useStudentColumns(listSearch);

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
    Object.assign(params, studentTypeToListParams(studentType));
    Object.assign(params, membershipToListParams(membership));
    if (dateFrom) {
      params.from = dateFrom;
      params.dateField = dateField;
    }
    if (dateTo) {
      params.to = dateTo;
      params.dateField = dateField;
    }
    if (status !== "all" && membership === "all") params.status = status;
    return params;
  }, [branchQuery, search, planId, studentType, membership, dateField, dateFrom, dateTo, status, sortBy, sortOrder, pageIndex, pageSize]);

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
    status !== "all",
    membership !== "all",
    studentType !== "all",
    planId !== "all",
    dateFrom || dateTo,
    dateField !== DEFAULT_STUDENTS_LIST_URL_STATE.dateField,
    sortBy !== "createdAt" || sortOrder !== "desc",
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    clearFilters();
  };

  const handleMembershipCardClick = (next: StudentsMembershipFilter) => {
    if (next === "all") {
      patchState({ membership: "all" }, { resetPage: true });
      return;
    }
    if (membership === next) {
      patchState({ membership: "all" }, { resetPage: true });
      return;
    }
    patchState({ membership: next, status: "all" }, { resetPage: true });
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
        {
          key: "enrollmentType",
          header: "Type",
          format: (r) =>
            getEnrollmentTypeLabel((r as { enrollmentType?: "NEW" | "REJOIN" }).enrollmentType),
        },
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
        {
          key: "renewal",
          header: "Renewal",
          format: (r) =>
            studentRenewalExportValue((r as { renewal?: StudentRenewalSummary }).renewal),
        },
        {
          key: "registeredAt",
          header: "Registered",
          format: (r) => {
            const row = r as { registeredAt?: string; createdAt?: string };
            const v = row.registeredAt ?? row.createdAt;
            return v ? formatDate(v) : "";
          },
        },
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
        <StatsCard
          title="Total students"
          value={summaryTotals.total}
          icon={Users}
          accent="primary"
          active={membership === "all"}
          onClick={() => handleMembershipCardClick("all")}
        />
        <StatsCard
          title="Active"
          value={summaryTotals.active}
          icon={UserCheck}
          accent="secondary"
          active={membership === "active"}
          onClick={() => handleMembershipCardClick("active")}
        />
        <StatsCard
          title="Renewal due"
          value={summaryTotals.due}
          icon={UserX}
          accent="neutral"
          active={membership === "inactive"}
          onClick={() => handleMembershipCardClick("inactive")}
        />
        <StatsCard
          title="Expiring ≤7d"
          value={summaryTotals.expiring}
          icon={Clock}
          accent="neutral"
          active={membership === "expiring_soon"}
          onClick={() => handleMembershipCardClick("expiring_soon")}
        />
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <SectionCard noPadding contentClassName="p-4">
          <DataTable
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                searchValue={search}
                onSearchChange={(v) => patchState({ search: v }, { resetPage: true })}
                searchPlaceholder="Search name, mobile, code…"
                onExport={handleExport}
                filters={
                  <DataTableFilters>
                    <FilterDropdown label="Filters" activeCount={filterCount} onClear={clearAllFilters}>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Student type</Label>
                          <Select
                            value={studentType}
                            onValueChange={(v) => {
                              patchState(
                                { studentType: v as typeof studentType },
                                { resetPage: true }
                              );
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All students</SelectItem>
                              {STUDENT_TYPE_FILTERS.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                  {item.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Date type</Label>
                          <Select
                            value={dateField}
                            onValueChange={(v) => {
                              patchState({ dateField: v as StudentsDateField }, { resetPage: true });
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.entries(STUDENT_DATE_FIELD_LABELS) as [StudentsDateField, string][]).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <TableDateRangeFilter
                          from={dateFrom}
                          to={dateTo}
                          onFromChange={(v) => patchState({ dateFrom: v }, { resetPage: true })}
                          onToChange={(v) => patchState({ dateTo: v }, { resetPage: true })}
                        />
                        <div className="space-y-1.5">
                          <Label className="text-xs">Plan</Label>
                          <Select
                            value={planId}
                            onValueChange={(v) => patchState({ planId: v }, { resetPage: true })}
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
                              patchState(
                                {
                                  status: v as typeof status,
                                  ...(v !== "all" ? { membership: "all" as const } : {}),
                                },
                                { resetPage: true }
                              );
                            }}
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
                              onValueChange={(v) => patchState({ sortBy: v as typeof sortBy })}
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
                              onValueChange={(v) => patchState({ sortOrder: v as "asc" | "desc" })}
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
            onRowClick={(row) =>
              navigate(`/students/${getStudentId(row)}`, {
                state: { studentsListSearch: listSearch },
              })
            }
            emptyIcon={Users}
            emptyTitle="No students found"
            emptyDescription="Try different filters or register a new student."
            serverPagination={{
              pageIndex,
              pageSize,
              totalRows: total,
              onPaginationChange: ({ pageIndex: pi, pageSize: ps }) => {
                patchState({ pageIndex: pi, pageSize: ps });
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
                      {
                        key: "enrollmentType",
                        header: "Type",
                        format: (r) =>
                          getEnrollmentTypeLabel(
                            (r as { enrollmentType?: "NEW" | "REJOIN" }).enrollmentType
                          ),
                      },
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
