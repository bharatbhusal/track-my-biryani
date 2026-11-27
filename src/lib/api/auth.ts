import { apiRequest } from "@/lib/api/client";
import type {
  AuthUser,
  GoogleStartPayload,
  LoginPayload,
  SignupPayload,
  UpdateCredentialsPayload,
} from "@/constants/types/auth.types";

export const authApi = {
  login: (input: LoginPayload) =>
    apiRequest<AuthUser>("/auth/login", { method: "POST", body: input }),
  signup: (input: SignupPayload) =>
    apiRequest<AuthUser>("/auth/signup", { method: "POST", body: input }),
  me: () => apiRequest<AuthUser>("/auth/me"),
  logout: () => apiRequest<{ message: string }>("/auth/logout", { method: "POST" }),
  startGoogle: (input: GoogleStartPayload) =>
    apiRequest<{ url: string }>("/auth/google/start", { method: "POST", body: input }),
  unlinkGoogle: () => apiRequest<{ linked: boolean }>("/auth/unlink", { method: "POST" }),
  updateCredentials: (input: UpdateCredentialsPayload) =>
    apiRequest<{ updated: boolean }>("/auth/credentials", { method: "PATCH", body: input }),
  checkUsername: (username: string) =>
    apiRequest<{ available: boolean }>(`/auth/check-username?username=${encodeURIComponent(username)}`),
};
