import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff } from "lucide-react";
import { notificationsService } from "@/api/services";
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
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { TableDateRangeFilter } from "@/components/shared/TableDateRangeFilter";
import {
  DataTable,
  DataTableToolbar,
  DataTableFilters,
} from "@/components/data-table";
import { getNotificationColumns } from "@/features/notifications/notification-table-columns";
import {
  getNotificationId,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_PRIORITIES,
  type NotificationStatusFilter,
} from "@/lib/notification";
import { isWithinDateRange } from "@/lib/dateRange";
import { exportToCsv } from "@/lib/export";
import {
  formatNotificationLabel,
  getNotificationMessage,
  getNotificationStudentName,
} from "@/lib/notification";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { listQueryOptions } from "@/lib/queryDefaults";
import {
  applyMarkAllReadToCache,
  invalidateNotificationQueries,
} from "@/lib/notifications-cache";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { branchQuery } = useBranchContext();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NotificationStatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const listParams = useMemo(
    () => ({
      limit: 100,
      ...branchQuery,
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(categoryFilter !== "all" ? { category: categoryFilter } : {}),
      ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
    }),
    [branchQuery, statusFilter, categoryFilter, priorityFilter]
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.notifications.list(listParams),
    queryFn: () => notificationsService.list(listParams),
    ...listQueryOptions,
  });

  const { data: countData } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(branchQuery),
    queryFn: () => notificationsService.unreadCount(branchQuery),
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(branchQuery),
    onMutate: () => {
      applyMarkAllReadToCache(queryClient);
    },
    onSuccess: (result) => {
      const n = result?.modified ?? 0;
      toast.success(
        n > 0 ? `${n} notification${n === 1 ? "" : "s"} marked as read` : "All notifications are already read"
      );
      void invalidateNotificationQueries(queryClient);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not mark all as read");
      void invalidateNotificationQueries(queryClient);
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  });

  const items = data?.items ?? [];
  const unreadCount = countData?.unreadCount ?? countData?.count ?? 0;

  const filteredItems = useMemo(() => {
    let rows = items;
    if (dateFrom || dateTo) {
      rows = rows.filter((n) => isWithinDateRange(n.createdAt, dateFrom, dateTo));
    }
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        getNotificationMessage(n).toLowerCase().includes(q) ||
        n.category?.toLowerCase().includes(q) ||
        n.type?.toLowerCase().includes(q) ||
        n.branch?.name?.toLowerCase().includes(q) ||
        getNotificationStudentName(n)?.toLowerCase().includes(q) ||
        n.student?.studentCode?.toLowerCase().includes(q)
    );
  }, [items, search, dateFrom, dateTo]);

  const unreadInView = useMemo(
    () => filteredItems.filter((n) => n.status === "unread").length,
    [filteredItems]
  );
  const showMarkAll = unreadCount > 0 || unreadInView > 0;

  const columns = useMemo(
    () =>
      getNotificationColumns({
        onMarkRead: (id) => markRead.mutate(id),
        onViewStudent: (studentId) => navigate(`/students/${studentId}`),
        markReadPending: markRead.isPending,
      }),
    [markRead, navigate]
  );

  const filterCount = [
    statusFilter !== "all",
    categoryFilter !== "all",
    priorityFilter !== "all",
    Boolean(dateFrom),
    Boolean(dateTo),
  ].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter("all");
    setCategoryFilter("all");
    setPriorityFilter("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  };

  const handleExport = async () => {
    if (filteredItems.length === 0) {
      toast.error("No rows to export");
      return;
    }
    await exportToCsv(
      filteredItems as unknown as Record<string, unknown>[],
      [
        { key: "createdAt", header: "Date", format: (r) => formatDate(String((r as { createdAt: string }).createdAt)) },
        { key: "title", header: "Title" },
        {
          key: "student",
          header: "Student",
          format: (r) =>
            getNotificationStudentName(r as unknown as import("@/types/domain").NotificationItem) ?? "",
        },
        {
          key: "message",
          header: "Message",
          format: (r) => getNotificationMessage(r as unknown as import("@/types/domain").NotificationItem),
        },
        { key: "category", header: "Category", format: (r) => formatNotificationLabel(String((r as { category?: string }).category)) },
        { key: "priority", header: "Priority" },
        { key: "status", header: "Status" },
        {
          key: "branch",
          header: "Branch",
          format: (r) => String((r as { branch?: { name?: string } }).branch?.name ?? ""),
        },
      ],
      `notifications-${new Date().toISOString().slice(0, 10)}.csv`
    );
    toast.success("Export started");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Notifications"
        description="Sort and filter alerts by date, priority, and category"
        actions={
          showMarkAll ? (
            <Button
              variant="outline"
              className="gap-2 shadow-sm"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
            >
              <BellOff className="h-4 w-4" />
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <DataTable
          columns={columns}
          data={filteredItems}
          loading={isLoading}
          enablePagination
          pageSize={15}
          stickyHeader
          getRowId={(row) => getNotificationId(row)}
          onRowClick={(row) => {
            if (row.status === "unread") {
              markRead.mutate(getNotificationId(row));
            }
          }}
          emptyIcon={Bell}
          emptyTitle={isError ? "Could not load notifications" : "No notifications found"}
          emptyDescription={
            isError
              ? "Check your connection and try again."
              : filterCount > 0 || search.trim()
                ? "Try adjusting filters or search."
                : "Alerts for expiring memberships and renewals will appear here."
          }
          toolbar={(table) => (
            <DataTableToolbar
              table={table}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search title, student, message…"
              onExport={handleExport}
              filters={
                <DataTableFilters>
                  <FilterDropdown label="Filters" activeCount={filterCount}>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status</Label>
                        <Select
                          value={statusFilter}
                          onValueChange={(v) => setStatusFilter(v as NotificationStatusFilter)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="unread">Unread</SelectItem>
                            <SelectItem value="read">Read</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {NOTIFICATION_CATEGORIES.map((c) => (
                              <SelectItem key={c} value={c}>
                                {formatNotificationLabel(c)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Priority</Label>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {NOTIFICATION_PRIORITIES.map((p) => (
                              <SelectItem key={p} value={p}>
                                {formatNotificationLabel(p)}
                              </SelectItem>
                            ))}
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
                        onClick={clearFilters}
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
      {isError && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
