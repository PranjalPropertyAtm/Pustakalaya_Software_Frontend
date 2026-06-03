import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SeatAvailabilityItem } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Lock, User, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeatGridProps {
  items: SeatAvailabilityItem[];
  selectedSeatId?: string | null;
  onSelect?: (seatId: string) => void;
  loading?: boolean;
  selectableSeatIds?: string[];
  shiftCode?: string;
  planName?: string;
  /** Max height of the scrollable seat map area (Tailwind class). */
  gridMaxHeightClass?: string;
}

const statusStyles = {
  vacant: "border-emerald-300/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:scale-[1.03] shadow-sm",
  occupied: "border-orange-300/80 bg-orange-50 text-orange-900 cursor-not-allowed",
  reserved: "border-amber-300/80 bg-amber-50 text-amber-900 cursor-not-allowed",
};

const shiftRing: Record<string, string> = {
  A: "ring-2 ring-blue-400/70 ring-offset-1",
  B: "ring-2 ring-violet-400/70 ring-offset-1",
};

export function SeatGrid({
  items,
  selectedSeatId,
  onSelect,
  selectableSeatIds,
  shiftCode,
  planName,
  gridMaxHeightClass = "max-h-[min(65vh,600px)]",
}: SeatGridProps) {
  const [zoom, setZoom] = useState(1);
  const selectableSeatIdsSet = new Set((selectableSeatIds ?? []).map(String));

  const cellSize = Math.round(52 * zoom);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {planName ? `${planName} · ` : ""}
          {shiftCode ? `Shift ${shiftCode} · ` : ""}
          {items.length} seats
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.max(0.75, z - 0.15))}
            disabled={zoom <= 0.75}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setZoom((z) => Math.min(1.5, z + 0.15))}
            disabled={zoom >= 1.5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "overflow-auto rounded-xl border border-border/80 bg-muted/20 p-4",
          gridMaxHeightClass
        )}
      >
        <div
          className="grid gap-2 transition-all duration-200"
          style={{
            gridTemplateColumns: `repeat(auto-fill, minmax(${cellSize}px, 1fr))`,
          }}
        >
          {items.map(({ seat, available, liveStatus }) => {
            const seatId = seat.id ?? seat._id;
            const isSelected = selectedSeatId === seatId;
            const canSelect =
              (available && (shiftCode ? true : liveStatus === "vacant")) ||
              selectableSeatIdsSet.has(String(seatId));
            const shiftRingClass = shiftCode ? shiftRing[shiftCode] : "";

            return (
              <button
                key={seatId}
                type="button"
                disabled={!canSelect}
                onClick={() => canSelect && onSelect?.(seatId)}
                style={{ minHeight: cellSize, minWidth: cellSize }}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 p-1 text-xs font-semibold transition-all duration-200",
                  statusStyles[liveStatus],
                  shiftRingClass,
                  isSelected && "ring-2 ring-primary ring-offset-2 scale-[1.05] z-10",
                  canSelect && "cursor-pointer",
                  !canSelect && "opacity-85"
                )}
                title={`Seat ${seat.seatNumber} — ${liveStatus}${shiftCode ? ` · Shift ${shiftCode}` : ""}`}
              >
                <span>{seat.seatNumber}</span>
                {seat.isLocked && <Lock className="absolute right-1 top-1 h-3 w-3 opacity-70" />}
                {liveStatus === "occupied" && <User className="h-3 w-3 mt-0.5 opacity-60" />}
                {!available && liveStatus === "vacant" && (
                  <Badge variant="warning" className="absolute -top-1 scale-[0.65]">
                    N/A
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SeatLegend({ shiftCode }: { shiftCode?: string }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs rounded-lg border border-border/60 bg-card px-4 py-3">
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded border-2 border-emerald-400 bg-emerald-50" /> Vacant
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded border-2 border-orange-400 bg-orange-50" /> Occupied
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded border-2 border-amber-400 bg-amber-50" /> Reserved
      </span>
      {shiftCode === "A" && (
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded ring-2 ring-blue-400" /> 6hr Shift A
        </span>
      )}
      {shiftCode === "B" && (
        <span className="flex items-center gap-1.5">
          <span className="h-3.5 w-3.5 rounded ring-2 ring-violet-400" /> 6hr Shift B
        </span>
      )}
      <span className="flex items-center gap-1.5">
        <span className="h-3.5 w-3.5 rounded ring-2 ring-primary ring-offset-1 bg-card" /> Selected
      </span>
    </div>
  );
}
