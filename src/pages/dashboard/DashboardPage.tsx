import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Users,
  Grid3X3,
  AlertTriangle,
  Building2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { reportsService, studentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/shared/StatsCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { typography } from "@/lib/typography";
import { cn, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getStudentId } from "@/lib/student";
import {
  branchActiveStudentsChartData,
  formatReportDateRange,
  planDistributionChartData,
  planWiseChartData,
  shiftWiseChartData,
} from "@/lib/reports";
import { dashboardQueryOptions, listQueryOptions } from "@/lib/queryDefaults";
import {
  LazyBarChart,
  LazyPieChart,
  LazyOccupancyChart,
  ChartLegend,
  CHART_COLORS,
} from "@/components/charts/LazyDashboardCharts";
import type { BranchDashboardResponse, SuperDashboardResponse } from "@/types/reports";

export default function DashboardPage() {
  const { isSuperAdmin, branchQuery, effectiveBranchId } = useBranchContext();
  const isNetworkView = isSuperAdmin && !effectiveBranchId;

  const branchQueryResult = useQuery({
    queryKey: queryKeys.reports.branchDashboard(branchQuery),
    queryFn: () => reportsService.branchDashboard(branchQuery) as Promise<BranchDashboardResponse>,
    enabled: !!effectiveBranchId,
    ...dashboardQueryOptions,
  });

  const superQuery = useQuery({
    queryKey: queryKeys.reports.superDashboard({}),
    queryFn: () => reportsService.superDashboard({}) as Promise<SuperDashboardResponse>,
    enabled: isNetworkView,
    ...dashboardQueryOptions,
  });

  const recentStudentsQuery = useQuery({
    queryKey: queryKeys.students.list({ ...branchQuery, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    queryFn: () =>
      studentsService.list({ ...branchQuery, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    enabled: !!effectiveBranchId,
    ...listQueryOptions,
    ...dashboardQueryOptions,
  });

  const active = isNetworkView ? superQuery : branchQueryResult;

  const branchData = branchQueryResult.data;
  const superData = superQuery.data;

  const planChartData = useMemo(() => {
    if (isNetworkView) return planDistributionChartData(superData?.planDistribution);
    return planWiseChartData(branchData?.metrics.planWise);
  }, [isNetworkView, superData, branchData]);

  const barChartData = useMemo(() => {
    if (isNetworkView) return branchActiveStudentsChartData(superData?.branches);
    return shiftWiseChartData(branchData?.metrics.shiftWise);
  }, [isNetworkView, superData, branchData]);

  const occupancyValue = useMemo(
    () =>
      isNetworkView
        ? Math.round(
            (superData?.branches.reduce((sum, b) => sum + b.occupancyPercent, 0) ?? 0) /
              Math.max(superData?.branches.length ?? 1, 1)
          )
        : (branchData?.metrics.occupancy.occupancyPercent ?? 0),
    [isNetworkView, superData, branchData]
  );

  const planLegendItems = useMemo(
    () =>
      planChartData.map((p, i) => ({
        name: p.name,
        color: CHART_COLORS[i % CHART_COLORS.length],
      })),
    [planChartData]
  );

  if (active.isLoading) return <LoadingState className="min-h-[50vh]" />;
  if (active.isError) return <ErrorState onRetry={() => active.refetch()} />;

  const dateLabel = formatReportDateRange(
    (isNetworkView ? superData?.dateRange : branchData?.dateRange)?.from,
    (isNetworkView ? superData?.dateRange : branchData?.dateRange)?.to
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title={isNetworkView ? "Network overview" : "Branch dashboard"}
        description={
          isNetworkView
            ? "Metrics and trends across all branches"
            : `${branchData?.branch.name ?? "Branch"} `
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports">
              Full reports
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isNetworkView ? (
          <>
            <StatsCard
              title="Active branches"
              value={superData?.totals.branches ?? 0}
              icon={Building2}
              accent="primary"
            />
            <StatsCard
              title="Active students"
              value={superData?.totals.activeStudents ?? 0}
              icon={Users}
              accent="secondary"
            />
            <StatsCard
              title="Expired students"
              value={superData?.totals.expiredStudents ?? 0}
              icon={AlertTriangle}
              accent="neutral"
            />
          </>
        ) : (
          <>
            <StatsCard
              title="Active students"
              value={branchData?.metrics.activeStudents ?? 0}
              icon={Users}
              accent="primary"
            />
            <StatsCard
              title="Seat occupancy"
              value={`${occupancyValue}%`}
              subtitle={`${branchData?.metrics.occupancy.occupiedSeats ?? 0} / ${branchData?.metrics.occupancy.totalSeats ?? 0} seats`}
              icon={Grid3X3}
              accent="secondary"
            />
            <StatsCard
              title="Renewals due"
              value={branchData?.metrics.renewalsDueCount ?? 0}
              subtitle="Next 30 days"
              icon={AlertTriangle}
              accent="neutral"
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardCard
          title={isNetworkView ? "Students by branch" : "Students by shift"}
          description={isNetworkView ? "Active memberships" : "Active memberships by shift"}
          className="lg:col-span-2"
        >
          <LazyBarChart data={barChartData} />
        </DashboardCard>

        <DashboardCard
          title="Plan distribution"
          description={isNetworkView ? "Across all branches" : "Active memberships"}
        >
          <LazyPieChart data={planChartData} />
          {planChartData.length > 0 && <ChartLegend items={planLegendItems} />}
        </DashboardCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard title="Occupancy" description="Utilization snapshot">
          <LazyOccupancyChart occupancyValue={occupancyValue} />
        </DashboardCard>

        {effectiveBranchId ? (
          <DashboardCard
            title="Recent students"
            description="Latest registrations"
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/students">View all</Link>
              </Button>
            }
          >
            <ul className="space-y-3">
              {(recentStudentsQuery.data?.items ?? []).map((s) => (
                <li key={getStudentId(s)}>
                  <Link
                    to={`/students/${getStudentId(s)}`}
                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className={cn(typography.bodyMedium, "truncate")}>{s.fullName}</p>
                      <p className={typography.muted}>
                        {s.studentCode ?? s.mobileNumber}
                        {s.createdAt ? ` · ${formatDate(s.createdAt)}` : ""}
                      </p>
                    </div>
                    <span className={cn(typography.muted, "capitalize shrink-0")}>{s.status}</span>
                  </Link>
                </li>
              ))}
              {(recentStudentsQuery.data?.items ?? []).length === 0 && (
                <p className={cn(typography.paginationMeta, "text-center py-6")}>No recent students</p>
              )}
            </ul>
          </DashboardCard>
        ) : (
          <DashboardCard title="Branch network" description="Quick actions">
            <div className={cn("space-y-4", typography.paginationMeta)}>
              <p className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden />
                Select a branch from the header to view seat maps, students, and branch analytics.
              </p>
              <p className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-secondary shrink-0 mt-0.5" aria-hidden />
                Open Reports for cross-branch comparison and plan distribution.
              </p>
              <Button asChild className="w-full sm:w-auto">
                <Link to="/reports">View reports</Link>
              </Button>
            </div>
          </DashboardCard>
        )}
      </div>
    </div>
  );
}
