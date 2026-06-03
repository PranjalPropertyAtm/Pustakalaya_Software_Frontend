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
import { DataTable, DataTableToolbar } from "@/components/data-table";
import { getPaymentColumns } from "@/features/payments/payment-table-columns";
import { SectionCard } from "@/components/shared/SectionCard";
import { exportToCsv } from "@/lib/export";
import { getPaymentId } from "@/lib/payment";
import { listQueryOptions } from "@/lib/queryDefaults";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "sonner";

export default function PaymentsPage() {
  const { branchQuery } = useBranchContext();
  const [tab, setTab] = useState("list");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [searchParams, setSearchParams] = useSearchParams();
  const columns = useMemo(() => getPaymentColumns(true), []);

  const initialTab = searchParams.get("tab");
  const initialStudentId = searchParams.get("studentId") ?? undefined;
  const initialRenewalId = searchParams.get("renewalId") ?? undefined;

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
    return params;
  }, [branchQuery, pageSize, pageIndex, debouncedSearch]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.payments.list(listParams),
    queryFn: () => paymentsService.list(listParams),
    ...listQueryOptions,
  });

  const payments = data?.items ?? [];
  const total = data?.total ?? payments.length;

  const handleExport = async () => {
    if (payments.length === 0) {
      toast.error("No payments to export");
      return;
    }
    await exportToCsv(
      payments as unknown as Record<string, unknown>[],
      [
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
                  searchPlaceholder="Search student, mode, status…"
                  onExport={handleExport}
                />
              )}
            />
          </SectionCard>
        </TabsContent>
        <TabsContent value="collect" className="mt-4">
          <CollectPaymentForm
            initialStudentLookup={initialStudentId}
            initialRenewalId={initialRenewalId}
            onSuccess={() => {
              setTab("list");
              refetch();
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete("tab");
                next.delete("studentId");
                next.delete("renewalId");
                return next;
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
