import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

export function HomeRedirect() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
