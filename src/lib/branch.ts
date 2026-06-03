import type { Branch } from "@/types/domain";

/** Backend returns `id`; normalize for selects and API calls. */
export function getBranchId(branch: Branch): string {
  return branch.id ?? branch._id ?? "";
}

export function getBranchLabel(branch: Branch): string {
  return branch.name;
}
