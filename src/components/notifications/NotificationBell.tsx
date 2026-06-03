import { memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { notificationsService } from "@/api/services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LoadingState } from "@/components/common/LoadingState";
import { useBranchContext } from "@/hooks/useBranchContext";
import { queryKeys } from "@/lib/queryKeys";
import { Link } from "react-router-dom";
import { NotificationList } from "@/components/notifications/NotificationList";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  applyMarkAllReadToCache,
  invalidateNotificationQueries,
} from "@/lib/notifications-cache";

function NotificationBellInner() {
  const queryClient = useQueryClient();
  const { branchQuery } = useBranchContext();

  const { data: countData } = useQuery({
    queryKey: queryKeys.notifications.unreadCount(branchQuery),
    queryFn: () => notificationsService.unreadCount(branchQuery),
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });

  const { data: listData, isLoading } = useQuery({
    queryKey: queryKeys.notifications.list({ limit: 8, status: "unread", ...branchQuery }),
    queryFn: () =>
      notificationsService.list({ limit: 8, status: "unread", ...branchQuery }),
    staleTime: 30_000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsService.markAllRead(branchQuery),
    onMutate: () => {
      applyMarkAllReadToCache(queryClient);
    },
    onSuccess: (result) => {
      const n = result?.modified ?? 0;
      if (n > 0) {
        toast.success(`${n} notification${n === 1 ? "" : "s"} marked as read`);
      }
      void invalidateNotificationQueries(queryClient);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not mark all as read");
      void invalidateNotificationQueries(queryClient);
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });

  const count = countData?.unreadCount ?? countData?.count ?? 0;
  const items = listData?.items ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}>
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              className={cn(
                "absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1",
                typography.badge
              )}
            >
              {count > 99 ? "99+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,24rem)] overflow-hidden p-0 shadow-elevated">
        <div className="flex items-center justify-between gap-2 bg-muted/30 px-4 py-3">
          <div>
            <span className={typography.cardTitle}>Notifications</span>
            {count > 0 && (
              <p className="text-xs text-muted-foreground">{count} unread</p>
            )}
          </div>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 gap-1 text-xs"
              onClick={() => markAll.mutate()}
              disabled={markAll.isPending}
              aria-label="Mark all notifications as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-[min(360px,50vh)]">
          {isLoading ? (
            <div className="p-4">
              <LoadingState variant="skeleton" />
            </div>
          ) : (
            <NotificationList
              compact
              items={items}
              emptyMessage="No unread notifications"
              onMarkRead={(id) => markRead.mutate(id)}
              markReadPending={markRead.isPending}
            />
          )}
        </ScrollArea>
        <Separator />
        <div className="bg-muted/20 p-2">
          <Button variant="ghost" className="w-full gap-2 text-sm" asChild>
            <Link to="/notifications">
              <ExternalLink className="h-3.5 w-3.5" />
              View notification center
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const NotificationBell = memo(NotificationBellInner);
