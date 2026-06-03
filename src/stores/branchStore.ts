import { create } from "zustand";
import { persist } from "zustand/middleware";

interface BranchState {
  selectedBranchId: string | null;
  setSelectedBranchId: (branchId: string | null) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      setSelectedBranchId: (selectedBranchId) => set({ selectedBranchId }),
    }),
    { name: "pustakalaya-branch" }
  )
);
