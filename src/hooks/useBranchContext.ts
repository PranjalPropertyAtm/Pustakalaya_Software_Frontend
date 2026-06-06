import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { branchesService } from "@/api/services/branches.service";
import { queryKeys } from "@/lib/queryKeys";
import { getBranchId } from "@/lib/branch";
import { staticQueryOptions } from "@/lib/queryDefaults";
import { ROLES, type Role } from "@/lib/constants";
import type { Branch } from "@/types/domain";
import { useAuthStore } from "@/stores/authStore";
import { useBranchStore } from "@/stores/branchStore";

function resolveSuperAdminBranchId(selectedBranchId: string | null, branches: Branch[]) {
  if (branches.length === 0) return null;

  if (selectedBranchId && branches.some((b) => getBranchId(b) === selectedBranchId)) {
    return selectedBranchId;
  }

  return getBranchId(branches[0]);
}

export function useBranchContext() {
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: queryKeys.branches.list({ limit: 100 }),
    queryFn: () => branchesService.list({ limit: 100, isActive: "true" }),
    enabled: !!user && isSuperAdmin,
    retry: 1,
    ...staticQueryOptions,
  });

  const branches = branchesData?.items ?? [];

  const effectiveBranchId = useMemo(() => {
    if (!user) return null;
    if (isSuperAdmin) {
      if (branchesLoading) return null;
      return resolveSuperAdminBranchId(selectedBranchId, branches);
    }
    return user.branchId ?? null;
  }, [user, isSuperAdmin, selectedBranchId, branches, branchesLoading]);

  const branchQuery = useMemo(
    () => (effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    [effectiveBranchId]
  );

  const requiresBranchSelection =
    isSuperAdmin && !branchesLoading && branches.length === 0;

  return {
    user,
    role: user?.role as Role | undefined,
    effectiveBranchId,
    branchQuery,
    requiresBranchSelection,
    isSuperAdmin,
    branchesLoading: isSuperAdmin && branchesLoading,
  };
}
