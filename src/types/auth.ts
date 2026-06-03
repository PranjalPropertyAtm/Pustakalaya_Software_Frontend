import type { Role } from "@/lib/constants";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  branchId?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}
