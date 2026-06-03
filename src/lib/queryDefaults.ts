import { keepPreviousData } from "@tanstack/react-query";

/** Shared list-query options: keep previous page visible while fetching next. */
export const listQueryOptions = {
  placeholderData: keepPreviousData,
} as const;

/** Long-lived reference data (branches, plans). */
export const staticQueryOptions = {
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
} as const;

/** Dashboard / report aggregates. */
export const dashboardQueryOptions = {
  staleTime: 2 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
} as const;
