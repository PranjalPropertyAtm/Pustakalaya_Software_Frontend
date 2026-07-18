import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard } from "lucide-react";
import { paymentsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState } from "@/components/common/ErrorState";
import { CollectPaymentForm } from "@/features/payments/CollectPaymentForm";
import { useSearchParams } from "react-router-dom";
import { DataTable, DataTableToolbar, DataTableFilters } from "@/components/data-table";
import { getPaymentColumns } from "@/features/payments/payment-table-columns";
import { SectionCard } from "@/components/shared/SectionCard";
import { FilterDropdown } from "@/components/shared/FilterDropdown";
import { TableDateRangeFilter } from "@/components/shared/TableDateRangeFilter";
import { exportToCsv } from "@/lib/export";
import {
  getPaymentId,
  getPaymentMembershipStartDate,
  getPaymentRegisteredOn,
} from "@/lib/payment";
import { listQueryOptions } from "@/lib/queryDefaults";
import { RENEWALS_RETURN_PATH } from "@/lib/studentsListUrl";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import {
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PAYMENT_TYPES,
  type PaymentStatus,
  type PaymentType,
} from "@/lib/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { Payment } from "@/types/domain";

type StatusFilter = "all" | PaymentStatus;
type TypeFilter = "all" | PaymentType;
type ModeFilter = "all" | (typeof PAYMENT_METHODS)[number];
type PaymentSortBy = "paidAt" | "amount" | "createdAt";

export default function PaymentsPage() {
  const { branchQuery } = useBranchContext();
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [paymentMode, setPaymentMode] = useState<ModeFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [membershipFrom, setMembershipFrom] = useState("");
  const [membershipTo, setMembershipTo] = useState("");
  const [sortBy, setSortBy] = useState<PaymentSortBy>("paidAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchParams, setSearchParams] = useSearchParams();

  const paymentsReturnPath = useMemo(() => {
    const q = searchParams.toString();
    return q ? `/payments?${q}` : "/payments";
  }, [searchParams]);

  const columns = useMemo(
    () => getPaymentColumns(true, { studentReturnTo: paymentsReturnPath }),
    [paymentsReturnPath]
  );

  const initialTab = searchParams.get("tab");
  const initialStudentId = searchParams.get("studentId") ?? undefined;
  const initialRenewalId = searchParams.get("renewalId") ?? undefined;
  const collectReturnTo = searchParams.get("returnTo") ?? undefined;

  const clearCollectSearchParams = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("tab");
      next.delete("studentId");
      next.delete("renewalId");
      next.delete("returnTo");
      return next;
    });
  };

  const handleCollectBack = () => {
    setTab("list");
    clearCollectSearchParams();
  };

  const collectBackTo =
    collectReturnTo ?? (initialRenewalId ? RENEWALS_RETURN_PATH : undefined);

  useEffect(() => {
    if (initialTab === "collect") setTab("collect");
  }, [initialTab]);

  const listParams = useMemo(() => {
    const params: Record<string, unknown> = {
      ...branchQuery,
      limit: pageSize,
      page: pageIndex + 1,
    };
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (status !== "all") params.status = status;
    if (paymentMode !== "all") params.paymentMode = paymentMode;
    if (type !== "all") params.type = type;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (membershipFrom) params.membershipFrom = membershipFrom;
    if (membershipTo) params.membershipTo = membershipTo;
    params.sortBy = sortBy;
    params.sortOrder = sortOrder;
    return params;
  }, [branchQuery, pageSize, pageIndex, debouncedSearch, status, paymentMode, type, dateFrom, dateTo, membershipFrom, membershipTo, sortBy, sortOrder]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payments.list(listParams),
    queryFn: () => paymentsService.list(listParams),
    ...listQueryOptions,
  });

  const payments = data?.items ?? [];
  const total = data?.pagination?.total ?? payments.length;

  const filterCount = [
    status !== "all",
    paymentMode !== "all",
    type !== "all",
    dateFrom || dateTo,
    membershipFrom || membershipTo,
    sortBy !== "paidAt" || sortOrder !== "desc",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setPaymentMode("all");
    setType("all");
    setDateFrom("");
    setDateTo("");
    setMembershipFrom("");
    setMembershipTo("");
    setSortBy("paidAt");
    setSortOrder("desc");
    setPageIndex(0);
  };

  const handleExport = async () => {
    if (payments.length === 0) {
      toast.error("No payments to export");
      return;
    }
    await exportToCsv(
      payments as unknown as Record<string, unknown>[],
      [
        { key: "paidAt", header: "Paid on", format: (r) => formatDate(String((r as { paidAt?: string }).paidAt ?? "")) },
        {
          key: "student",
          header: "Student",
          format: (r) => String((r as { student?: { fullName?: string } }).student?.fullName ?? ""),
        },
        {
          key: "registeredOn",
          header: "Registered on",
          format: (r) => {
            const v = getPaymentRegisteredOn(r as unknown as Payment);
            return v ? formatDate(v) : "";
          },
        },
        {
          key: "membershipStartDate",
          header: "Membership start",
          format: (r) => {
            const v = getPaymentMembershipStartDate(r as unknown as Payment);
            return v ? formatDate(v) : "";
          },
        },
        { key: "amount", header: "Amount" },
        { key: "status", header: "Status" },
        { key: "paymentMode", header: "Mode" },
        { key: "type", header: "Type" },
      ],
      "payments.csv"
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Payments" description="Collect fees and review payment history" />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="list">History</TabsTrigger>
          <TabsTrigger value="collect">Collect payment</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="mt-4">
          {isError && <ErrorState onRetry={refetch} />}
          <SectionCard noPadding contentClassName="p-4">
            <DataTable
              columns={columns}
              data={payments}
              loading={isLoading}
              enablePagination
              manualFiltering
              stickyHeader
              getRowId={(row) => getPaymentId(row)}
              emptyIcon={CreditCard}
              emptyTitle="No payments recorded"
              emptyDescription="Collected payments will appear here."
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
                  searchPlaceholder="Search student, payment no., reference…"
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
                                {PAYMENT_STATUSES.map((s) => (
                                  <SelectItem key={s.value} value={s.value}>
                                    {s.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Payment mode</Label>
                            <Select
                              value={paymentMode}
                              onValueChange={(v) => {
                                setPaymentMode(v as ModeFilter);
                                setPageIndex(0);
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Mode" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All modes</SelectItem>
                                {PAYMENT_METHODS.map((mode) => (
                                  <SelectItem key={mode} value={mode}>
                                    {mode.replace(/_/g, " ")}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Payment type</Label>
                            <Select
                              value={type}
                              onValueChange={(v) => {
                                setType(v as TypeFilter);
                                setPageIndex(0);
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {PAYMENT_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Paid on</Label>
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
                          <div className="space-y-1.5">
                            <Label className="text-xs">Membership start</Label>
                            <TableDateRangeFilter
                              from={membershipFrom}
                              to={membershipTo}
                              onFromChange={(v) => {
                                setMembershipFrom(v);
                                setPageIndex(0);
                              }}
                              onToChange={(v) => {
                                setMembershipTo(v);
                                setPageIndex(0);
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                              <Label className="text-xs">Sort</Label>
                              <Select
                                value={sortBy}
                                onValueChange={(v) => {
                                  setSortBy(v as PaymentSortBy);
                                  setPageIndex(0);
                                }}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="paidAt">Paid on</SelectItem>
                                  <SelectItem value="amount">Amount</SelectItem>
                                  <SelectItem value="createdAt">Recorded</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Order</Label>
                              <Select
                                value={sortOrder}
                                onValueChange={(v) => {
                                  setSortOrder(v as "asc" | "desc");
                                  setPageIndex(0);
                                }}
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
            />
          </SectionCard>
        </TabsContent>
        <TabsContent value="collect" className="mt-4">
          <CollectPaymentForm
            initialStudentLookup={initialStudentId}
            initialRenewalId={initialRenewalId}
            backTo={collectBackTo}
            onBack={collectBackTo ? undefined : handleCollectBack}
            onSuccess={() => {
              setTab("list");
              refetch();
              clearCollectSearchParams();
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
