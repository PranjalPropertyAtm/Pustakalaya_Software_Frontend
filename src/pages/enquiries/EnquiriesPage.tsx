import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  ClipboardList,
  Clock,
  AlertTriangle,
  Heart,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { enquiriesService, plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { listQueryOptions, staticQueryOptions, dashboardQueryOptions } from "@/lib/queryDefaults";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
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
import { getEnquiryId } from "@/lib/enquiry";
import { getPlanId, getPlanLabel } from "@/lib/plan";
import { ENQUIRY_STATUSES, ENQUIRY_SOURCES } from "@/schemas/enquiry.schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEnquiryColumns } from "@/features/enquiries/enquiry-table-columns";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { ROLES } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

type StatusFilter = "all" | (typeof ENQUIRY_STATUSES)[number]["value"];
type FollowUpFilter = "all" | "today" | "overdue";

export default function EnquiriesPage() {
  const navigate = useNavigate();
  const { branchQuery } = useBranchContext();
  const columns = useEnquiryColumns();
  const isSuperAdmin = useAuthStore((s) => s.user?.role === ROLES.SUPER_ADMIN);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [source, setSource] = useState("all");
  const [planId, setPlanId] = useState("all");
  const [followUpDue, setFollowUpDue] = useState<FollowUpFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ...branchQuery,
      limit: pageSize,
      page: pageIndex + 1,
      sortBy: "createdAt",
      sortOrder: "desc",
    };
    if (search.trim()) params.search = search.trim();
    if (status !== "all") params.status = status;
    if (source !== "all") params.source = source;
    if (planId !== "all") params.planId = planId;
    if (followUpDue !== "all") params.followUpDue = followUpDue;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    return params;
  }, [branchQuery, search, status, source, planId, followUpDue, dateFrom, dateTo, pageIndex, pageSize]);

  const { data: plansData } = useQuery({
    queryKey: queryKeys.plans.list({ isActive: "true" }),
    queryFn: () => plansService.list({ isActive: "true" }),
    ...staticQueryOptions,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.enquiries.list(listParams),
    queryFn: () => enquiriesService.list(listParams),
    ...listQueryOptions,
  });

  const { data: dashboard } = useQuery({
    queryKey: queryKeys.enquiries.dashboard(branchQuery),
    queryFn: () => enquiriesService.dashboard(branchQuery),
    ...dashboardQueryOptions,
  });

  const enquiries = data?.items ?? [];
  const total = data?.pagination?.total ?? enquiries.length;
  const plans = plansData?.items ?? [];

  const filterCount = [
    status !== "all",
    source !== "all",
    planId !== "all",
    followUpDue !== "all",
    dateFrom || dateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setSource("all");
    setPlanId("all");
    setFollowUpDue("all");
    setDateFrom("");
    setDateTo("");
    setPageIndex(0);
  };

  const handleExport = async () => {
    try {
      const exportData = await enquiriesService.export(listParams);
      await exportToCsv(
        exportData.rows as Record<string, unknown>[],
        exportData.columns.map((c) => ({ key: c.key, header: c.header })),
        `enquiries-${new Date().toISOString().slice(0, 10)}.csv`
      );
      toast.success("Export downloaded");
    } catch {
      toast.error("Export failed");
    }
  };

  const handleBulkClose = async (rows: typeof enquiries) => {
    if (rows.length === 0) return;
    try {
      await Promise.all(rows.map((e) => enquiriesService.close(getEnquiryId(e), {})));
      toast.success(`Closed ${rows.length} enquiries`);
      void refetch();
    } catch {
      toast.error("Bulk close failed for some rows");
    }
  };

  if (isError) {
    return <ErrorState title="Failed to load enquiries" onRetry={() => void refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enquiry Management"
        description="Track prospective students from first visit to registration"
        actions={
          <div className="flex flex-wrap gap-2">
            {isSuperAdmin && (
              <Button variant="outline" asChild>
                <Link to="/enquiries/reports">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/enquiries/new">
                <Plus className="mr-2 h-4 w-4" />
                New enquiry
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="New enquiries"
          value={dashboard?.newEnquiries ?? 0}
          icon={ClipboardList}
          accent="primary"
        />
        <StatsCard
          title="Today's follow-ups"
          value={dashboard?.todaysFollowUps ?? 0}
          icon={Clock}
          accent="secondary"
        />
        <StatsCard
          title="Overdue follow-ups"
          value={dashboard?.overdueFollowUps ?? 0}
          icon={AlertTriangle}
          accent="neutral"
        />
        <StatsCard
          title="Interested"
          value={dashboard?.interestedStudents ?? 0}
          icon={Heart}
          accent="secondary"
        />
        <StatsCard
          title="Converted this month"
          value={dashboard?.convertedThisMonth ?? 0}
          icon={TrendingUp}
          accent="secondary"
        />
        <StatsCard
          title="Conversion rate"
          value={`${dashboard?.conversionRate ?? 0}%`}
          icon={BarChart3}
          accent="primary"
        />
      </div>

      <SectionCard title="All enquiries" noPadding>
        <DataTable
          columns={columns}
          data={enquiries}
          loading={isLoading}
          enableRowSelection
          enablePagination
          enableVirtualization={enquiries.length > 15}
          manualFiltering
          stickyHeader
          stickyColumnIds={["enquiryCode", "actions"]}
          getRowId={(row) => getEnquiryId(row)}
          onRowClick={(row) => navigate(`/enquiries/${getEnquiryId(row)}`)}
          serverPagination={{
            pageIndex,
            pageSize,
            totalRows: total,
            onPaginationChange: ({ pageIndex: pi, pageSize: ps }) => {
              setPageIndex(pi);
              setPageSize(ps);
            },
          }}
          toolbar={(table) => (
            <DataTableToolbar
              table={table}
              searchValue={search}
              onSearchChange={(v) => {
                setSearch(v);
                setPageIndex(0);
              }}
              searchPlaceholder="Search name, phone, ID…"
              onExport={handleExport}
              filters={
                <DataTableFilters>
                  <FilterDropdown label="Filters" activeCount={filterCount} onClear={clearFilters}>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={status}
                          onValueChange={(v) => {
                            setStatus(v as StatusFilter);
                            setPageIndex(0);
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {ENQUIRY_STATUSES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Source</Label>
                        <Select
                          value={source}
                          onValueChange={(v) => {
                            setSource(v);
                            setPageIndex(0);
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All sources</SelectItem>
                            {ENQUIRY_SOURCES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
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
                            <SelectValue placeholder="Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All plans</SelectItem>
                            {plans.map((p) => {
                              const id = getPlanId(p);
                              return (
                                <SelectItem key={id} value={id}>{getPlanLabel(p)}</SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Follow-up</Label>
                        <Select
                          value={followUpDue}
                          onValueChange={(v) => {
                            setFollowUpDue(v as FollowUpFilter);
                            setPageIndex(0);
                          }}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Follow-up" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="today">Due today</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <TableDateRangeFilter
                        from={dateFrom}
                        to={dateTo}
                        onFromChange={(v) => {
                          setDateFrom(v);
                          setPageIndex(0);
                        }}
                        onToChange={(v) => {
                          setDateTo(v);
                          setPageIndex(0);
                        }}
                      />
                    </div>
                  </FilterDropdown>
                </DataTableFilters>
              }
            />
          )}
          bulkActions={[
            {
              label: "Export selected",
              onClick: async (rows) => {
                if (rows.length === 0) return;
                await exportToCsv(
                  rows as unknown as Record<string, unknown>[],
                  [
                    { key: "enquiryCode", header: "Enquiry ID" },
                    { key: "fullName", header: "Name" },
                    { key: "mobileNumber", header: "Phone" },
                    { key: "status", header: "Status" },
                  ],
                  `enquiries-selected-${new Date().toISOString().slice(0, 10)}.csv`
                );
              },
            },
            {
              label: "Close selected",
              onClick: (rows) => void handleBulkClose(rows),
            },
          ]}
        />
      </SectionCard>
    </div>
  );
}
