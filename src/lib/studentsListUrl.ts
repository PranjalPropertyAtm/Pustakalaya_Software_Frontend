import {
  STUDENT_STATUSES,
  STUDENT_TYPE_FILTERS,
  type StudentTypeFilter,
} from "@/lib/constants";

export const STUDENTS_LIST_SEARCH_KEY = "pustakalaya.students.listSearch";

export type StudentsStatusFilter = "all" | (typeof STUDENT_STATUSES)[number];
export type StudentsStudentTypeFilter = "all" | StudentTypeFilter;
export type StudentsMembershipFilter = "all" | "active" | "inactive" | "expiring_soon";
export type StudentsDateField = "joiningDate" | "createdAt" | "startDate" | "endDate";
export type StudentsSortBy = "createdAt" | "endDate" | "fullName";

export type StudentsListUrlState = {
  search: string;
  status: StudentsStatusFilter;
  studentType: StudentsStudentTypeFilter;
  membership: StudentsMembershipFilter;
  planId: string;
  dateField: StudentsDateField;
  dateFrom: string;
  dateTo: string;
  sortBy: StudentsSortBy;
  sortOrder: "asc" | "desc";
  pageIndex: number;
  pageSize: number;
};

const DATE_FIELDS = new Set<StudentsDateField>([
  "joiningDate",
  "createdAt",
  "startDate",
  "endDate",
]);
const SORT_BY_VALUES = new Set<StudentsSortBy>(["createdAt", "endDate", "fullName"]);
const STUDENT_TYPE_VALUES = new Set<StudentsStudentTypeFilter>([
  "all",
  ...STUDENT_TYPE_FILTERS.map((item) => item.value),
]);

const MEMBERSHIP_VALUES = new Set<StudentsMembershipFilter>([
  "all",
  "active",
  "inactive",
  "expiring_soon",
]);

export const DEFAULT_STUDENTS_LIST_URL_STATE: StudentsListUrlState = {
  search: "",
  status: "all",
  studentType: "all",
  membership: "all",
  planId: "all",
  dateField: "createdAt",
  dateFrom: "",
  dateTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  pageIndex: 0,
  pageSize: 20,
};

function parseEnum<T extends string>(value: string | null, allowed: Set<T>, fallback: T): T {
  if (value && allowed.has(value as T)) return value as T;
  return fallback;
}

function resolveStudentTypeFromLegacyParams(searchParams: URLSearchParams): StudentsStudentTypeFilter {
  const direct = searchParams.get("studentType");
  if (direct && STUDENT_TYPE_VALUES.has(direct as StudentsStudentTypeFilter)) {
    return direct as StudentsStudentTypeFilter;
  }

  const enrollmentType = searchParams.get("enrollmentType");
  if (enrollmentType === "NEW" || enrollmentType === "REJOIN") {
    return enrollmentType;
  }

  const renewal = searchParams.get("renewal");
  if (renewal === "renewed") {
    return renewal;
  }

  return "all";
}

export function membershipToListParams(
  membership: StudentsMembershipFilter
): { membership?: string; expiringInDays?: number } {
  if (membership === "all") return {};
  if (membership === "expiring_soon") {
    return { membership: "expiring_soon", expiringInDays: 7 };
  }
  return { membership };
}

export function studentTypeToListParams(
  studentType: StudentsStudentTypeFilter
): { enrollmentType?: string; renewal?: string } {
  if (studentType === "NEW" || studentType === "REJOIN") {
    return { enrollmentType: studentType };
  }
  if (studentType === "renewed") {
    return { renewal: studentType };
  }
  return {};
}

export function getStudentTypeFilterLabel(studentType: StudentsStudentTypeFilter): string {
  if (studentType === "all") return "All students";
  return STUDENT_TYPE_FILTERS.find((item) => item.value === studentType)?.label ?? "All students";
}

export function parseStudentsListSearchParams(
  searchParams: URLSearchParams
): StudentsListUrlState {
  const statusValues = new Set<StudentsStatusFilter>(["all", ...STUDENT_STATUSES]);
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
  const pageSizeRaw = Number(searchParams.get("size") || 20) || 20;
  const pageSize = Math.min(100, Math.max(10, pageSizeRaw));

  return {
    search: searchParams.get("q")?.trim() ?? "",
    status: parseEnum(searchParams.get("status"), statusValues, "all"),
    studentType: resolveStudentTypeFromLegacyParams(searchParams),
    membership: parseEnum(searchParams.get("membership"), MEMBERSHIP_VALUES, "all"),
    planId: searchParams.get("plan")?.trim() || "all",
    dateField: parseEnum(searchParams.get("dateField"), DATE_FIELDS, "createdAt"),
    dateFrom: searchParams.get("from")?.trim() ?? "",
    dateTo: searchParams.get("to")?.trim() ?? "",
    sortBy: parseEnum(searchParams.get("sortBy"), SORT_BY_VALUES, "createdAt"),
    sortOrder: searchParams.get("sortOrder") === "asc" ? "asc" : "desc",
    pageIndex: page - 1,
    pageSize,
  };
}

export function studentsListSearchFromState(state: StudentsListUrlState): string {
  const params = new URLSearchParams();

  if (state.search.trim()) params.set("q", state.search.trim());
  if (state.status !== "all") params.set("status", state.status);
  if (state.studentType !== "all") params.set("studentType", state.studentType);
  if (state.membership !== "all") params.set("membership", state.membership);
  if (state.planId !== "all") params.set("plan", state.planId);
  if (state.dateField !== "createdAt") params.set("dateField", state.dateField);
  if (state.dateFrom) params.set("from", state.dateFrom);
  if (state.dateTo) params.set("to", state.dateTo);
  if (state.sortBy !== "createdAt") params.set("sortBy", state.sortBy);
  if (state.sortOrder !== "desc") params.set("sortOrder", state.sortOrder);
  if (state.pageIndex > 0) params.set("page", String(state.pageIndex + 1));
  if (state.pageSize !== 20) params.set("size", String(state.pageSize));

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function persistStudentsListSearch(search: string) {
  try {
    sessionStorage.setItem(STUDENTS_LIST_SEARCH_KEY, search);
  } catch {
    // ignore storage errors
  }
}

export function readPersistedStudentsListSearch(): string {
  try {
    return sessionStorage.getItem(STUDENTS_LIST_SEARCH_KEY) ?? "";
  } catch {
    return "";
  }
}

export function resolveStudentsListReturnSearch(locationState?: unknown): string {
  const fromState = (locationState as { studentsListSearch?: string } | null)?.studentsListSearch;
  if (fromState) return fromState;
  return readPersistedStudentsListSearch();
}

export const RENEWALS_RETURN_PATH = "/renewals";

export function buildPaymentsReturnPath(queryString?: string): string {
  const q = queryString?.replace(/^\?/, "").trim() ?? "";
  return q ? `/payments?${q}` : "/payments";
}

export type StudentDetailNavState = {
  /** When set, Back navigates here instead of the students list. */
  returnTo?: string;
  studentsListSearch?: string;
};

export function resolveStudentDetailReturnPath(locationState?: unknown): string {
  const state = locationState as StudentDetailNavState | null;
  if (state?.returnTo) return state.returnTo;
  return `/students${resolveStudentsListReturnSearch(locationState)}`;
}
