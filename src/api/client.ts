import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { endpoints } from "@/api/endpoints";
import type { ApiErrorBody, ApiResponse } from "@/types/api";
import type { LoginResponse } from "@/types/auth";
import { useAuthStore } from "@/stores/authStore";

export class ApiClientError extends Error {
  statusCode: number;
  errors?: ApiErrorBody["errors"];

  constructor(message: string, statusCode = 500, errors?: ApiErrorBody["errors"]) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const response = await axios.post<ApiResponse<LoginResponse>>(
    endpoints.auth.refresh,
    {},
    { withCredentials: true }
  );
  const token = response.data.data?.accessToken;
  if (token) {
    useAuthStore.getState().setAccessToken(token);
    return token;
  }
  return null;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original.url?.includes("/auth/login")) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        if (newToken) {
          original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }

    const message =
      error.response?.data?.message || error.message || "Something went wrong";
    const errors = error.response?.data?.errors;
    throw new ApiClientError(message, status ?? 500, errors);
  }
);

export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await promise;
  return data.data;
}
