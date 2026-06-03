export interface BranchCounsellor {
  id: string;
  fullName: string;
  email: string;
  role: "COUNSELLOR" | "BRANCH_COUNSELLOR";
  branchId: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  branch?: {
    id: string;
    name: string;
    isActive?: boolean;
  } | null;
}
