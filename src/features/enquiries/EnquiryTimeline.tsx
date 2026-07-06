import { StatusBadge, statusToneFromValue } from "@/components/shared/StatusBadge";
import { typography } from "@/lib/typography";
import { cn, formatDate } from "@/lib/utils";
import type { EnquiryTimelineEvent } from "@/types/enquiry";

interface EnquiryTimelineProps {
  events: EnquiryTimelineEvent[];
  className?: string;
}

function eventTone(type: string) {
  if (type === "converted") return "success" as const;
  if (type === "closed" || type === "cancelled") return "neutral" as const;
  if (type === "reminder") return "warning" as const;
  if (type === "follow_up") return "warning" as const;
  return statusToneFromValue(type);
}

export function EnquiryTimeline({ events, className }: EnquiryTimelineProps) {
  if (events.length === 0) {
    return <p className={typography.muted}>No timeline events yet.</p>;
  }

  return (
    <ol className={cn("relative space-y-0", className)}>
      {events.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
          {index < events.length - 1 && (
            <span
              className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-border"
              aria-hidden
            />
          )}
          <span className="relative z-10 mt-1.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-primary bg-background" />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={typography.bodyMedium}>{event.title}</p>
              {event.status && (
                <StatusBadge label={event.status.replace(/_/g, " ")} tone={eventTone(event.type)} />
              )}
            </div>
            <p className={typography.muted}>{event.description}</p>
            <p className={cn(typography.caption, "text-muted-foreground")}>
              {formatDate(event.timestamp)}
            </p>
            {event.meta?.nextFollowUpDate ? (
              <p className={typography.caption}>
                Next follow-up: {formatDate(String(event.meta.nextFollowUpDate))}
                {event.meta.nextFollowUpTime ? ` at ${String(event.meta.nextFollowUpTime)}` : ""}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
