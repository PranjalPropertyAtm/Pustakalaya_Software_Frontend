import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  DEFAULT_STUDENTS_LIST_URL_STATE,
  parseStudentsListSearchParams,
  persistStudentsListSearch,
  studentsListSearchFromState,
  type StudentsListUrlState,
} from "@/lib/studentsListUrl";

type StudentsListPatch = Partial<StudentsListUrlState>;

export function useStudentsListUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(
    () => parseStudentsListSearchParams(searchParams),
    [searchParams]
  );

  const listSearch = useMemo(() => studentsListSearchFromState(state), [state]);

  useEffect(() => {
    persistStudentsListSearch(listSearch);
  }, [listSearch]);

  const patchState = useCallback(
    (patch: StudentsListPatch, options?: { resetPage?: boolean }) => {
      setSearchParams(
        (prev) => {
          const current = parseStudentsListSearchParams(prev);
          const next: StudentsListUrlState = {
            ...current,
            ...patch,
            ...(options?.resetPage ? { pageIndex: 0 } : {}),
          };
          const params = new URLSearchParams();

          if (next.search.trim()) params.set("q", next.search.trim());
          if (next.status !== "all") params.set("status", next.status);
          if (next.studentType !== "all") params.set("studentType", next.studentType);
          if (next.membership !== "all") params.set("membership", next.membership);
          if (next.planId !== "all") params.set("plan", next.planId);
          if (next.dateField !== DEFAULT_STUDENTS_LIST_URL_STATE.dateField) {
            params.set("dateField", next.dateField);
          }
          if (next.dateFrom) params.set("from", next.dateFrom);
          if (next.dateTo) params.set("to", next.dateTo);
          if (next.sortBy !== DEFAULT_STUDENTS_LIST_URL_STATE.sortBy) {
            params.set("sortBy", next.sortBy);
          }
          if (next.sortOrder !== DEFAULT_STUDENTS_LIST_URL_STATE.sortOrder) {
            params.set("sortOrder", next.sortOrder);
          }
          if (next.pageIndex > 0) params.set("page", String(next.pageIndex + 1));
          if (next.pageSize !== DEFAULT_STUDENTS_LIST_URL_STATE.pageSize) {
            params.set("size", String(next.pageSize));
          }

          return params;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  return {
    ...state,
    listSearch,
    patchState,
    clearFilters,
  };
}
