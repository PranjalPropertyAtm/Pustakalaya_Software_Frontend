import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/stores/authStore";
import { useBranchStore } from "@/stores/branchStore";
import { ROLES } from "@/lib/constants";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { toast } from "sonner";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const selectedBranchId = useBranchStore((s) => s.selectedBranchId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accessToken) return;

    const url = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socket = io(url, {
      path: "/socket.io",
      auth: { token: accessToken },
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (user?.role === ROLES.SUPER_ADMIN && selectedBranchId) {
        socket.emit("notification:subscribe-branch", selectedBranchId);
      }
    });

    socket.on("notification:new", (payload: { title?: string; message?: string; body?: string }) => {
      // Refresh both Bell counter and Notifications list immediately.
      // We invalidate by prefixes to avoid needing to match exact params (limit/status/etc).
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all, exact: false });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["notifications", "list"], exact: false });

      const detail = payload.message ?? payload.body;
      toast.info(payload.title ?? "New notification", {
        description: detail,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user?.role, selectedBranchId, queryClient]);

  return socketRef;
}
