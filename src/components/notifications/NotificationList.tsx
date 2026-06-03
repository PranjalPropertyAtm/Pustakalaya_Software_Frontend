import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  CreditCard,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NotificationItem } from "@/types/domain";
import {
  formatNotificationLabel,
  getNotificationId,
  getNotificationMessage,
  getNotificationStudentLinkId,
  getNotificationStudentName,
  notificationPriorityVariant,
} from "@/lib/notification";
import { typography } from "@/lib/typography";
import { cn, formatDate } from "@/lib/utils";

interface NotificationListProps {
  items: NotificationItem[];
  emptyMessage?: string;
  compact?: boolean;
  onMarkRead?: (id: string) => void;
  markReadPending?: boolean;
}

function categoryIcon(category: string): LucideIcon {
  if (category.includes("expiry")) return AlertTriangle;
  if (category.includes("renewal")) return RefreshCw;
  if (category.includes("payment")) return CreditCard;
  return Bell;
}

function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/50 py-2 last:border-0 sm:flex-row sm:justify-between sm:gap-3">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">{label}</span>
      <span className="break-words text-sm sm:text-right">{value}</span>
    </div>
  );
}

function MetadataBlock({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <div className="mt-2 rounded-lg bg-muted/40 p-3">
      <p className="mb-1 text-xs font-medium text-muted-foreground">Additional info</p>
      {Object.entries(metadata).map(([key, value]) => {
        if (value === undefined || value === null || value === "") return null;
        const display =
          typeof value === "object"
            ? JSON.stringify(value)
            : key.toLowerCase().includes("date") && typeof value === "string"
              ? formatDate(value)
              : String(value);
        return (
          <DetailItem key={key} label={formatNotificationLabel(key)} value={display} />
        );
      })}
    </div>
  );
}

function NotificationDetails({ item }: { item: NotificationItem }) {
  const message = getNotificationMessage(item);

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <DetailItem
        label="Message"
        value={<span className="whitespace-pre-wrap font-normal">{message}</span>}
      />
      <DetailItem label="Type" value={formatNotificationLabel(item.type)} />
      <DetailItem label="Category" value={formatNotificationLabel(item.category)} />
      <DetailItem label="Priority" value={formatNotificationLabel(item.priority)} />
      <DetailItem label="Status" value={formatNotificationLabel(item.status)} />
      <DetailItem label="Created" value={formatDate(item.createdAt)} />
      {item.readAt && <DetailItem label="Read at" value={formatDate(item.readAt)} />}
      {item.expiresAt && <DetailItem label="Expires" value={formatDate(item.expiresAt)} />}
      <DetailItem label="Branch" value={item.branch?.name} />
      {getNotificationStudentLinkId(item) && (
        <DetailItem
          label="Student"
          value={
            <Link
              to={`/students/${getNotificationStudentLinkId(item)}`}
              className="font-medium text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {getNotificationStudentName(item) ?? "View student profile"}
            </Link>
          }
        />
      )}
      <MetadataBlock metadata={item.metadata} />
    </div>
  );
}

export function NotificationList({
  items,
  emptyMessage = "No notifications yet.",
  compact = false,
  onMarkRead,
  markReadPending = false,
}: NotificationListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p
        className={cn(
          "text-center text-muted-foreground",
          compact ? "p-6 text-sm" : "py-12 text-sm"
        )}
      >
        {emptyMessage}
      </p>
    );
  }

  const toggle = (id: string, unread: boolean) => {
    setExpandedId((prev) => (prev === id ? null : id));
    if (unread && onMarkRead && expandedId !== id) {
      onMarkRead(id);
    }
  };

  return (
    <div className={cn("grid", compact ? "gap-0" : "gap-3")}>
      {items.map((n) => {
        const id = getNotificationId(n);
        const isUnread = n.status === "unread";
        const isExpanded = expandedId === id;
        const message = getNotificationMessage(n);
        const preview =
          message.length > 100 && !isExpanded ? `${message.slice(0, 100)}…` : message;
        const Icon = categoryIcon(n.category);

        if (compact) {
          return (
            <div
              key={id}
              className={cn(
                "border-b border-border/60 last:border-0",
                isUnread && "bg-primary/[0.03]"
              )}
            >
              <button
                type="button"
                onClick={() => toggle(id, isUnread)}
                aria-expanded={isExpanded}
                className="flex w-full gap-3 p-4 text-left transition-colors hover:bg-muted/50"
              >
                <div className="relative shrink-0">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {isUnread && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(typography.bodyMedium, isUnread && "font-semibold")}>
                      {n.title}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                  <p className={cn("mt-0.5 line-clamp-2", typography.muted)}>{preview}</p>
                  <span className={cn("mt-1 block", typography.muted)}>
                    {formatDate(n.createdAt)}
                    {getNotificationStudentName(n) ? ` · ${getNotificationStudentName(n)}` : ""}
                    {n.branch?.name ? ` · ${n.branch.name}` : ""}
                  </span>
                </div>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pl-[3.25rem] text-sm">
                  <NotificationDetails item={n} />
                </div>
              )}
            </div>
          );
        }

        return (
          <article
            key={id}
            className={cn(
              "overflow-hidden rounded-xl border border-border/80 bg-card shadow-card transition-all",
              isUnread && "border-primary/25",
              isExpanded && "ring-2 ring-primary/15 shadow-elevated"
            )}
          >
            <button
              type="button"
              onClick={() => toggle(id, isUnread)}
              aria-expanded={isExpanded}
              className="flex w-full gap-4 p-4 text-left transition-colors hover:bg-muted/30"
            >
              <div className="relative shrink-0">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br",
                    isUnread
                      ? "from-primary/15 to-primary/5 text-primary"
                      : "from-muted to-muted/50 text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                {isUnread && (
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("font-semibold leading-snug", !isUnread && "font-medium")}>
                    {n.title}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Badge variant={notificationPriorityVariant(n.priority)}>
                      {formatNotificationLabel(n.priority)}
                    </Badge>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{preview}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(n.createdAt)}
                    {n.branch?.name ? ` · ${n.branch.name}` : ""}
                  </span>
                  {n.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {formatNotificationLabel(n.category)}
                    </Badge>
                  )}
                  {isUnread && (
                    <Badge variant="default" className="text-[10px]">
                      New
                    </Badge>
                  )}
                </div>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-border/60 px-4 pb-4 pt-3">
                <NotificationDetails item={n} />
                {isUnread && onMarkRead && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled={markReadPending}
                    onClick={() => onMarkRead(id)}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
