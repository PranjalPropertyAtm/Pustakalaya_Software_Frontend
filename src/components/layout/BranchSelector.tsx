import { lazy, Suspense, memo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { branchesService } from "@/api/services/branches.service";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchStore } from "@/stores/branchStore";
import { getBranchId, getBranchLabel } from "@/lib/branch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { staticQueryOptions } from "@/lib/queryDefaults";

const CreateBranchDialog = lazy(() =>
  import("@/features/branches/CreateBranchDialog").then((m) => ({ default: m.CreateBranchDialog }))
);

function BranchSelectorInner() {
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const setSelectedBranchId = useBranchStore((s) => s.setSelectedBranchId);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.branches.list({ limit: 100 }),
    queryFn: () => branchesService.list({ limit: 100, isActive: "true" }),
    retry: 1,
    ...staticQueryOptions,
  });

  const branches = data?.items ?? [];

  useEffect(() => {
    if (isLoading) return;

    if (branches.length === 0) {
      if (selectedBranchId) setSelectedBranchId(null);
      return;
    }

    const isValid =
      selectedBranchId && branches.some((b) => getBranchId(b) === selectedBranchId);
    if (!isValid) {
      setSelectedBranchId(getBranchId(branches[0]));
    }
  }, [branches, selectedBranchId, setSelectedBranchId, isLoading]);

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground hidden sm:block" aria-hidden />
      <div className="min-w-[160px] max-w-[220px] space-y-1">
        <Label className="sr-only" htmlFor="branch-selector">
          Branch
        </Label>
        {isError ? (
          <Button variant="outline" size="sm" className="h-9 w-full" onClick={() => refetch()}>
            Retry loading branches
          </Button>
        ) : (
          <Select
            value={selectedBranchId ?? ""}
            onValueChange={(v) => setSelectedBranchId(v || null)}
            disabled={isLoading}
          >
            <SelectTrigger id="branch-selector" className="h-9" aria-label="Select branch">
              <SelectValue
                placeholder={
                  isLoading
                    ? "Loading..."
                    : branches.length === 0
                      ? "No branches"
                      : "Select branch"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => {
                const id = getBranchId(b);
                return (
                  <SelectItem key={id} value={id}>
                    {getBranchLabel(b)}
                    {!b.isActive && " (inactive)"}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
      <Suspense fallback={null}>
        <CreateBranchDialog />
      </Suspense>
      {branches.length === 0 && !isLoading && (
        <Button variant="ghost" size="sm" className="h-9 px-1 text-xs" asChild>
          <Link to="/branches">Manage branches</Link>
        </Button>
      )}
    </div>
  );
}

export const BranchSelector = memo(BranchSelectorInner);
