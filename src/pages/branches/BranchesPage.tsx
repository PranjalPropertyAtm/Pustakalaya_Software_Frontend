import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMemo } from "react";
import { Building2, MapPin, Phone, Clock, UserCog } from "lucide-react";
import { Link } from "react-router-dom";
import { CounsellorFormDialog } from "@/features/counsellors/CounsellorFormDialog";
import { branchesService, counsellorsService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchId, getBranchLabel } from "@/lib/branch";
import { useBranchStore } from "@/stores/branchStore";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateBranchDialog } from "@/features/branches/CreateBranchDialog";
import { EditBranchDialog } from "@/features/branches/EditBranchDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { ApiClientError } from "@/api/client";

export default function BranchesPage() {
  const queryClient = useQueryClient();
  const setSelectedBranchId = useBranchStore((s) => s.setSelectedBranchId);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const syncSeatsMutation = useMutation({
    mutationFn: (branchId: string) => branchesService.syncSeats(branchId),
    onSuccess: (data) => {
      toast.success(
        `Seats synced: ${data.seatsSync.created} created, ${data.seatsSync.activeSeats} active`
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.branches.all });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to sync seats"),
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.branches.list({ limit: 100, all: true }),
    queryFn: () => branchesService.list({ limit: 100 }),
  });

  const { data: counsellorsData } = useQuery({
    queryKey: queryKeys.counsellors.list({}),
    queryFn: () => counsellorsService.list(),
  });

  const branches = data?.items ?? [];
  const counsellors = counsellorsData?.items ?? [];

  const counsellorByBranch = useMemo(() => {
    const map = new Map<string, (typeof counsellors)[number]>();
    for (const c of counsellors) {
      if (c.branchId) map.set(c.branchId, c);
    }
    return map;
  }, [counsellors]);

  const occupiedBranchIds = useMemo(
    () => counsellors.map((c) => c.branchId).filter((id): id is string => Boolean(id)),
    [counsellors]
  );

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        description="Create and manage library branches across the network"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/counsellors">Manage counsellors</Link>
            </Button>
            <CreateBranchDialog trigger={<Button>New branch</Button>} />
          </div>
        }
      />

      {branches.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No branches yet"
          description="Create your first branch to start managing students, seats, and reports."
          action={<CreateBranchDialog trigger={<Button>Create branch</Button>} />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => {
            const id = getBranchId(branch);
            const isSelected = selectedBranchId === id;
            return (
              <Card
                key={id}
                className={isSelected ? "ring-2 ring-primary border-primary/30" : ""}
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <CardTitle className="text-lg">{getBranchLabel(branch)}</CardTitle>
                  <Badge variant={branch.isActive ? "success" : "outline"}>
                    {branch.isActive ? "Active" : "Suspended"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {branch.address && (
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                      {branch.address}
                    </p>
                  )}
                  {branch.contactNumber && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      {branch.contactNumber}
                    </p>
                  )}
                  {(branch.openingTime || branch.closingTime) && (
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      {branch.openingTime} – {branch.closingTime}
                    </p>
                  )}
                  {branch.totalSeats != null && (
                    <p className="text-xs">
                      {branch.totalSeats} seats · {branch.floors ?? 1} floor(s)
                    </p>
                  )}
                  {(() => {
                    const counsellor = counsellorByBranch.get(id);
                    return counsellor ? (
                      <p className="text-xs flex items-start gap-2 pt-1 border-t border-border/60">
                        <UserCog className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          <span className="text-foreground font-medium">{counsellor.fullName}</span>
                          <br />
                          {counsellor.email}
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700 dark:text-amber-400">No counsellor assigned</p>
                    );
                  })()}
                  <div className="flex flex-col gap-2 mt-2">
                    {counsellorByBranch.get(id) ? (
                      <CounsellorFormDialog
                        mode="edit"
                        branches={branches}
                        counsellor={counsellorByBranch.get(id)}
                        occupiedBranchIds={occupiedBranchIds}
                      />
                    ) : (
                      <CounsellorFormDialog
                        mode="create"
                        branches={branches}
                        defaultBranchId={id}
                        occupiedBranchIds={occupiedBranchIds}
                        trigger={
                          <Button variant="outline" size="sm" className="w-full gap-1">
                            <UserCog className="h-3.5 w-3.5" />
                            Add counsellor
                          </Button>
                        }
                      />
                    )}
                    <EditBranchDialog branch={branch} />
                    <Button
                      variant={isSelected ? "secondary" : "outline"}
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedBranchId(id)}
                    >
                      {isSelected ? "Selected for operations" : "Use this branch"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      disabled={syncSeatsMutation.isPending}
                      onClick={() => syncSeatsMutation.mutate(id)}
                    >
                      Sync seats from capacity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
