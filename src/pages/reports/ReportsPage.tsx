import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Users,
  Grid3X3,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { reportsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { TableDateRangeFilter } from "@/components/shared/TableDateRangeFilter";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { DataTable, DataTableToolbar } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  defaultReportDateRange,
  formatReportDateRange,
  monthlyRegistrationsChartData,
  planDistributionChartData,
  planWiseChartData,
  shiftWiseChartData,
} from "@/lib/reports";
import {
  LazyBarChart,
  LazyPieChart,
  LazyComparisonBarChart,
} from "@/components/charts/LazyDashboardCharts";
import { dashboardQueryOptions } from "@/lib/queryDefaults";
import {
  getBranchComparisonColumns,
  getMonthlyRegistrationsColumns,
  getPlanDistributionColumns,
  getPlanWiseColumns,
  getRenewalsDueColumns,
  getShiftWiseColumns,
} from "@/features/reports/report-table-columns";
import { exportToCsv } from "@/lib/export";
import { toast } from "sonner";
import type {
  BranchDashboardResponse,
  BranchOccupancyResponse,
  BranchRegistrationsByMonthResponse,
  BranchRenewalsDueResponse,
  RegistrationsByMonthResponse,
  SuperComparisonResponse,
  SuperDashboardResponse,
  SuperPlanDistributionResponse,
} from "@/types/reports";

type BranchReportsBundle = {
  dashboard: BranchDashboardResponse;
  occupancy: BranchOccupancyResponse;
  renewalsDue: BranchRenewalsDueResponse;
  registrationsByMonth: BranchRegistrationsByMonthResponse;
};

type SuperReportsBundle = {
  dashboard: SuperDashboardResponse;
  comparison: SuperComparisonResponse;
  planDist: SuperPlanDistributionResponse;
  registrationsByMonth: RegistrationsByMonthResponse;
};

async function exportRows<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T | string; header: string }[],
  filename: string
) {
  if (rows.length === 0) {
    toast.error("No rows to export");
    return;
  }
  await exportToCsv(rows, columns, filename);
}

function MonthlyRegistrationsSection({
  data,
  branchName,
}: {
  data: RegistrationsByMonthResponse;
  branchName?: string;
}) {
  const columns = useMemo(() => getMonthlyRegistrationsColumns(), []);
  const chartData = useMemo(() => monthlyRegistrationsChartData(data.months), [data.months]);

  return (
    <div className="space-y-6">
      <StatsCard
        title="New registrations"
        value={data.totalRegistrations}
        subtitle={
          branchName
            ? `${branchName} · ${formatReportDateRange(data.dateRange.from, data.dateRange.to)}`
            : formatReportDateRange(data.dateRange.from, data.dateRange.to)
        }
        icon={Users}
        accent="primary"
        className="max-w-sm"
      />

      <DashboardCard
        title="Registrations by month"
        description="New students registered each month (renewals not included)"
      >
        <LazyBarChart data={chartData} emptyLabel="No registrations in this period" className="h-[280px] w-full" />
      </DashboardCard>

      <SectionCard noPadding contentClassName="p-4">
        <DataTable
          columns={columns}
          data={data.months}
          enablePagination
          pageSize={12}
          stickyHeader
          getRowId={(row) => row.monthKey}
          emptyTitle="No registrations"
          emptyDescription="Widen the date range above to see monthly counts."
          toolbar={(table) => (
            <DataTableToolbar
              table={table}
              onExport={() =>
                void exportRows(
                  data.months as unknown as Record<string, unknown>[],
                  [
                    { key: "monthKey", header: "Month" },
                    { key: "studentCount", header: "Students registered" },
                  ],
                  "monthly-registrations.csv"
                )
              }
            />
          )}
        />
      </SectionCard>
    </div>
  );
}

function SuperReportsView({ data }: { data: SuperReportsBundle }) {
  const comparisonColumns = useMemo(() => getBranchComparisonColumns(), []);
  const planDistColumns = useMemo(() => getPlanDistributionColumns(), []);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="comparison">Branch comparison</TabsTrigger>
        <TabsTrigger value="plans">Plan distribution</TabsTrigger>
        <TabsTrigger value="registrations">Registrations</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard title="Branches" value={data.dashboard.totals.branches} icon={Building2} accent="primary" />
          <StatsCard
            title="Active students"
            value={data.dashboard.totals.activeStudents}
            icon={Users}
            accent="secondary"
          />
          <StatsCard
            title="Expired students"
            value={data.dashboard.totals.expiredStudents}
            icon={AlertTriangle}
            accent="neutral"
          />
        </div>

        <SectionCard noPadding contentClassName="p-4">
          <DataTable
            columns={comparisonColumns}
            data={data.comparison.comparison}
            enablePagination
            pageSize={10}
            stickyHeader
            getRowId={(row) => row.branchId}
            emptyTitle="No branch data"
            emptyDescription="Branch metrics will appear here."
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                onExport={() =>
                  void exportRows(
                    data.comparison.comparison as unknown as Record<string, unknown>[],
                    [
                      { key: "branchName", header: "Branch" },
                      { key: "activeStudents", header: "Active" },
                      { key: "expiredStudents", header: "Expired" },
                      { key: "occupancyPercent", header: "Occupancy %" },
                      { key: "totalSeats", header: "Seats" },
                    ],
                    "branch-comparison.csv"
                  )
                }
              />
            )}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="comparison" className="space-y-6 mt-4">
        <DashboardCard title="Active vs expired" description="Students by branch">
          <LazyComparisonBarChart data={data.comparison.activeVsExpired.branches} />
        </DashboardCard>

        <SectionCard noPadding contentClassName="p-4">
          <DataTable
            columns={comparisonColumns}
            data={data.comparison.comparison}
            enablePagination
            pageSize={15}
            stickyHeader
            getRowId={(row) => row.branchId}
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                onExport={() =>
                  void exportRows(
                    data.comparison.comparison as unknown as Record<string, unknown>[],
                    [
                      { key: "branchName", header: "Branch" },
                      { key: "activeStudents", header: "Active" },
                      { key: "expiredStudents", header: "Expired" },
                      { key: "occupancyPercent", header: "Occupancy %" },
                    ],
                    "branch-comparison.csv"
                  )
                }
              />
            )}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="plans" className="space-y-6 mt-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardCard
            title="Plan mix"
            description={`${data.planDist.totalStudentsWithPlan} students with a plan`}
          >
            <LazyPieChart data={planDistributionChartData(data.planDist.distribution)} />
          </DashboardCard>

          <StatsCard
            title="Total with plan"
            value={data.planDist.totalStudentsWithPlan}
            subtitle="Across all branches"
            icon={BarChart3}
            accent="primary"
          />
        </div>

        <SectionCard noPadding contentClassName="p-4">
          <DataTable
            columns={planDistColumns}
            data={data.planDist.distribution}
            enablePagination
            pageSize={10}
            stickyHeader
            getRowId={(row) => row.planId}
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                onExport={() =>
                  void exportRows(
                    data.planDist.distribution as unknown as Record<string, unknown>[],
                    [
                      { key: "planName", header: "Plan" },
                      { key: "studentCount", header: "Students" },
                      { key: "sharePercent", header: "Share %" },
                    ],
                    "plan-distribution.csv"
                  )
                }
              />
            )}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="registrations" className="space-y-6 mt-4">
        <MonthlyRegistrationsSection data={data.registrationsByMonth} />
      </TabsContent>
    </Tabs>
  );
}

function BranchReportsView({ data }: { data: BranchReportsBundle }) {
  const renewalsColumns = useMemo(() => getRenewalsDueColumns(), []);
  const planWiseColumns = useMemo(() => getPlanWiseColumns(), []);
  const shiftWiseColumns = useMemo(() => getShiftWiseColumns(), []);

  return (
    <Tabs defaultValue="overview">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
        <TabsTrigger value="renewals">Renewals due</TabsTrigger>
        <TabsTrigger value="registrations">Registrations</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Active students"
            value={data.dashboard.metrics.activeStudents}
            icon={Users}
            accent="primary"
          />
          <StatsCard
            title="Occupancy"
            value={`${data.dashboard.metrics.occupancy.occupancyPercent}%`}
            subtitle={`${data.dashboard.metrics.occupancy.occupiedSeats} / ${data.dashboard.metrics.occupancy.totalSeats} seats`}
            icon={Grid3X3}
            accent="secondary"
          />
          <StatsCard
            title="Renewals due"
            value={data.dashboard.metrics.renewalsDueCount}
            subtitle="Next 30 days"
            icon={AlertTriangle}
            accent="neutral"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardCard title="Plan breakdown" description="Active students by plan">
            <LazyPieChart
              data={planWiseChartData(data.dashboard.metrics.planWise)}
              className="h-[240px] w-full"
            />
          </DashboardCard>

          <DashboardCard title="Shift breakdown" description="Active students by shift">
            <LazyBarChart
              data={shiftWiseChartData(data.dashboard.metrics.shiftWise)}
              className="h-[240px] w-full"
              emptyLabel="No shift data"
            />
          </DashboardCard>
        </div>
      </TabsContent>

      <TabsContent value="occupancy" className="space-y-6 mt-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatsCard title="Occupancy" value={`${data.occupancy.occupancyPercent}%`} icon={Grid3X3} accent="primary" />
          <StatsCard title="Active students" value={data.occupancy.activeStudents} icon={Users} accent="secondary" />
          <StatsCard title="Total seats" value={data.occupancy.branch.totalSeats} icon={Building2} accent="neutral" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="By plan" noPadding contentClassName="p-4">
            <DataTable
              columns={planWiseColumns}
              data={data.occupancy.planWise}
              getRowId={(row) => row.planId}
              emptyTitle="No plan data"
            />
          </SectionCard>
          <SectionCard title="By shift" noPadding contentClassName="p-4">
            <DataTable
              columns={shiftWiseColumns}
              data={data.occupancy.shiftWise}
              getRowId={(row) => row.shiftCode}
              emptyTitle="No shift data"
            />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="renewals" className="space-y-4 mt-4">
        <StatsCard
          title="Expiring memberships"
          value={data.renewalsDue.totalDocs}
          subtitle="Within the next 30 days"
          icon={AlertTriangle}
          accent="primary"
          className="max-w-sm"
        />

        <SectionCard noPadding contentClassName="p-4">
          <DataTable
            columns={renewalsColumns}
            data={data.renewalsDue.items}
            enablePagination
            pageSize={15}
            stickyHeader
            getRowId={(row) => row.studentCode}
            emptyTitle="No renewals due"
            emptyDescription="Students expiring soon will appear here."
            toolbar={(table) => (
              <DataTableToolbar
                table={table}
                onExport={() =>
                  void exportRows(
                    data.renewalsDue.items as unknown as Record<string, unknown>[],
                    [
                      { key: "fullName", header: "Name" },
                      { key: "studentCode", header: "Code" },
                      { key: "mobileNumber", header: "Mobile" },
                      { key: "plan", header: "Plan" },
                      { key: "endDate", header: "End date" },
                    ],
                    "renewals-due.csv"
                  )
                }
              />
            )}
          />
        </SectionCard>
      </TabsContent>

      <TabsContent value="registrations" className="space-y-6 mt-4">
        <MonthlyRegistrationsSection
          data={data.registrationsByMonth}
          branchName={data.dashboard.branch.name}
        />
      </TabsContent>
    </Tabs>
  );
}

export default function ReportsPage() {
  const { isSuperAdmin, branchQuery, effectiveBranchId } = useBranchContext();
  const isNetworkView = isSuperAdmin && !effectiveBranchId;
  const defaultRange = useMemo(() => defaultReportDateRange(365), []);
  const [from, setFrom] = useState(defaultRange.from);
  const [to, setTo] = useState(defaultRange.to);

  const dateParams = useMemo(() => ({ ...branchQuery, from, to }), [branchQuery, from, to]);
  const superDateParams = useMemo(() => ({ from, to }), [from, to]);

  const branchReports = useQuery({
    queryKey: queryKeys.reports.branchBundle(dateParams),
    queryFn: async (): Promise<BranchReportsBundle> => {
      const [dashboard, occupancy, renewalsDue, registrationsByMonth] = await Promise.all([
        reportsService.branchDashboard(dateParams) as Promise<BranchDashboardResponse>,
        reportsService.branchOccupancy(branchQuery) as Promise<BranchOccupancyResponse>,
        reportsService.branchRenewalsDue({ ...branchQuery, limit: 100 }) as Promise<BranchRenewalsDueResponse>,
        reportsService.branchRegistrationsByMonth(dateParams) as Promise<BranchRegistrationsByMonthResponse>,
      ]);
      return { dashboard, occupancy, renewalsDue, registrationsByMonth };
    },
    enabled: !!effectiveBranchId,
    ...dashboardQueryOptions,
  });

  const superReports = useQuery({
    queryKey: queryKeys.reports.superBundle(superDateParams),
    queryFn: async (): Promise<SuperReportsBundle> => {
      const [dashboard, comparison, planDist, registrationsByMonth] = await Promise.all([
        reportsService.superDashboard(superDateParams) as Promise<SuperDashboardResponse>,
        reportsService.superComparison(superDateParams) as Promise<SuperComparisonResponse>,
        reportsService.superPlanDistribution({}) as Promise<SuperPlanDistributionResponse>,
        reportsService.superRegistrationsByMonth(superDateParams) as Promise<RegistrationsByMonthResponse>,
      ]);
      return { dashboard, comparison, planDist, registrationsByMonth };
    },
    enabled: isNetworkView,
    ...dashboardQueryOptions,
  });

  const active = isNetworkView ? superReports : branchReports;
  const dateLabel = formatReportDateRange(from, to);

  if (active.isLoading) return <LoadingState className="min-h-[50vh]" />;
  if (active.isError) return <ErrorState onRetry={() => active.refetch()} />;

  const description = isNetworkView
    ? "Cross-branch analytics and comparisons"
    : `${branchReports.data?.dashboard.branch.name ?? "Branch"} · ${dateLabel}`;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Reports"
        description={description}
        actions={
          <div className="w-full sm:w-auto sm:min-w-[280px]">
            <TableDateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
          </div>
        }
      />

      {isNetworkView && superReports.data ? (
        <SuperReportsView data={superReports.data} />
      ) : branchReports.data ? (
        <BranchReportsView data={branchReports.data} />
      ) : null}
    </div>
  );
}
