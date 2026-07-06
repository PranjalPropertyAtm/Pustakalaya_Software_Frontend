import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BarChart3, TrendingUp, Users, ClipboardList } from "lucide-react";
import { enquiriesService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { dashboardQueryOptions } from "@/lib/queryDefaults";
import { PageHeader } from "@/components/common/PageHeader";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { SectionCard } from "@/components/shared/SectionCard";
import { DashboardCard } from "@/components/shared/DashboardCard";
import { StatsCard } from "@/components/shared/StatsCard";
import { Button } from "@/components/ui/button";
import { TableDateRangeFilter } from "@/components/shared/TableDateRangeFilter";
import { LazyBarChart } from "@/components/charts/LazyDashboardCharts";
import { enquirySourceLabel } from "@/lib/enquiry";

export default function EnquiryReportsPage() {
  const { branchQuery } = useBranchContext();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const reportParams = useMemo(() => {
    const params: Record<string, unknown> = { ...branchQuery };
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    return params;
  }, [branchQuery, dateFrom, dateTo]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.enquiries.reports(reportParams),
    queryFn: () => enquiriesService.reports(reportParams),
    ...dashboardQueryOptions,
  });

  const dailyChart = useMemo(
    () =>
      (data?.dailyEnquiries ?? []).map((d) => ({
        name: d.date.slice(5),
        value: d.count,
      })),
    [data]
  );

  const sourceChart = useMemo(
    () =>
      (data?.sourceWise ?? []).map((s) => ({
        name: enquirySourceLabel(s.source).slice(0, 12),
        value: s.count,
      })),
    [data]
  );

  if (isLoading) return <LoadingState className="min-h-[40vh]" />;
  if (isError || !data) {
    return <ErrorState title="Failed to load reports" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/enquiries">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Enquiries
          </Link>
        </Button>
      </div>

      <PageHeader
        title="Enquiry Reports"
        description="Analyse enquiry volume, sources, counsellor performance, and conversions"
        actions={
          <TableDateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFromChange={setDateFrom}
            onToChange={setDateTo}
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total enquiries" value={data.totalEnquiries} icon={ClipboardList} accent="primary" />
        <StatsCard title="Converted" value={data.convertedEnquiries} icon={Users} accent="secondary" />
        <StatsCard title="Conversion rate" value={`${data.conversionRate}%`} icon={TrendingUp} accent="primary" />
        <StatsCard title="Lost enquiries" value={data.lostEnquiries} icon={BarChart3} accent="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardCard title="Daily enquiries">
          <LazyBarChart data={dailyChart} />
        </DashboardCard>
        <DashboardCard title="Source-wise enquiries">
          <LazyBarChart data={sourceChart} />
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Branch-wise performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Branch</th>
                  <th className="pb-2 pr-4 font-medium">Total</th>
                  <th className="pb-2 pr-4 font-medium">Converted</th>
                  <th className="pb-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.branchWise.map((row) => (
                  <tr key={String(row.branchId)} className="border-b border-border/40">
                    <td className="py-2 pr-4">{row.branchName ?? "—"}</td>
                    <td className="py-2 pr-4">{row.count}</td>
                    <td className="py-2 pr-4">{row.converted}</td>
                    <td className="py-2">{Math.round(row.conversionRate)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Counsellor performance">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Counsellor</th>
                  <th className="pb-2 pr-4 font-medium">Total</th>
                  <th className="pb-2 pr-4 font-medium">Interested</th>
                  <th className="pb-2 pr-4 font-medium">Converted</th>
                  <th className="pb-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.counsellorPerformance.map((row) => (
                  <tr key={String(row.counsellorId)} className="border-b border-border/40">
                    <td className="py-2 pr-4">{row.counsellorName}</td>
                    <td className="py-2 pr-4">{row.total}</td>
                    <td className="py-2 pr-4">{row.interested}</td>
                    <td className="py-2 pr-4">{row.converted}</td>
                    <td className="py-2">{Math.round(row.conversionRate)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Plan-wise interest">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Plan</th>
                  <th className="pb-2 font-medium">Enquiries</th>
                </tr>
              </thead>
              <tbody>
                {data.planWise.map((row) => (
                  <tr key={String(row.planId)} className="border-b border-border/40">
                    <td className="py-2 pr-4">{row.planName ?? "—"}</td>
                    <td className="py-2">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Monthly trend">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Month</th>
                  <th className="pb-2 font-medium">Enquiries</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyEnquiries.map((row) => (
                  <tr key={row.month} className="border-b border-border/40">
                    <td className="py-2 pr-4">{row.month}</td>
                    <td className="py-2">{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
