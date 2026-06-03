import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserCog, Mail, Building2 } from "lucide-react";
import { branchesService, counsellorsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { CounsellorFormDialog } from "@/features/counsellors/CounsellorFormDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";

export default function CounsellorsPage() {
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: queryKeys.branches.list({ limit: 100 }),
    queryFn: () => branchesService.list({ limit: 100 }),
  });

  const {
    data: counsellorsData,
    isLoading: counsellorsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.counsellors.list({}),
    queryFn: () => counsellorsService.list(),
  });

  const branches = branchesData?.items ?? [];
  const counsellors = counsellorsData?.items ?? [];

  const occupiedBranchIds = useMemo(
    () => counsellors.map((c) => c.branchId).filter((id): id is string => Boolean(id)),
    [counsellors]
  );

  const branchesWithoutCounsellor = useMemo(() => {
    const assigned = new Set(occupiedBranchIds);
    return branches.filter((b) => !assigned.has(b.id ?? b._id ?? ""));
  }, [branches, occupiedBranchIds]);

  if (branchesLoading || counsellorsLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branch counsellors"
        description="Create logins and assign which branch each counsellor can access"
        actions={
          <CounsellorFormDialog
            mode="create"
            branches={branches}
            occupiedBranchIds={occupiedBranchIds}
            trigger={<Button>Add counsellor</Button>}
          />
        }
      />

      {branchesWithoutCounsellor.length > 0 && (
        <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2">
          {branchesWithoutCounsellor.length} branch(es) without a counsellor:{" "}
          {branchesWithoutCounsellor.map((b) => b.name).join(", ")}
        </p>
      )}

      {counsellors.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No counsellors yet"
          description="Create a branch counsellor account and assign branch access."
          action={
            <CounsellorFormDialog
              mode="create"
              branches={branches}
              occupiedBranchIds={occupiedBranchIds}
            />
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {counsellors.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{c.fullName}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="h-3.5 w-3.5" />
                      {c.email}
                    </p>
                  </div>
                  <Badge variant={c.isActive ? "success" : "outline"}>
                    {c.isActive ? "Active" : "Suspended"}
                  </Badge>
                </div>
                <p className="text-sm flex items-center gap-1.5 text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>
                    Branch: <strong className="text-foreground">{c.branch?.name ?? "—"}</strong>
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">Role: {c.role.replace("_", " ")}</p>
                <CounsellorFormDialog
                  mode="edit"
                  branches={branches}
                  counsellor={c}
                  occupiedBranchIds={occupiedBranchIds}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
