import { apiClient, unwrap } from "@/api/client";
import { endpoints } from "@/api/endpoints";
import type { LoginPayload, LoginResponse } from "@/types/auth";

export const authService = {
  login: (payload: LoginPayload): Promise<LoginResponse> =>
    unwrap(apiClient.post<import("@/types/api").ApiResponse<LoginResponse>>(endpoints.auth.login, payload)),
  logout: () => unwrap(apiClient.post(endpoints.auth.logout)),
  forgotPassword: (email: string) =>
    unwrap(apiClient.post(endpoints.auth.forgotPassword, { email })),
};

export type { LoginResponse };
