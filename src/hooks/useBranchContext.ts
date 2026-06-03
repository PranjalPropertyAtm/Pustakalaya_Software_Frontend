import { useMemo } from "react";
import { ROLES, type Role } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";
import { useBranchStore } from "@/stores/branchStore";

export function useBranchContext() {
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);

  const effectiveBranchId = useMemo(() => {
    if (!user) return null;
    if (user.role === ROLES.SUPER_ADMIN) return selectedBranchId;
    return user.branchId ?? null;
  }, [user, selectedBranchId]);

  const branchQuery = useMemo(
    () => (effectiveBranchId ? { branchId: effectiveBranchId } : {}),
    [effectiveBranchId]
  );

  const requiresBranchSelection =
    user?.role === ROLES.SUPER_ADMIN && !selectedBranchId;

  return {
    user,
    role: user?.role as Role | undefined,
    effectiveBranchId,
    branchQuery,
    requiresBranchSelection,
    isSuperAdmin: user?.role === ROLES.SUPER_ADMIN,
  };
}
