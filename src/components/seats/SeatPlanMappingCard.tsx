import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { plansService, seatsService } from "@/api/services";
import { ApiClientError } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { getPlanId, getPlanLabel, isShiftBasedPlan } from "@/lib/plan";
import { SHIFT_CODES } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SeatPlanMappingCardProps {
  branchId: string;
  totalSeats?: number;
}

export function SeatPlanMappingCard({ branchId, totalSeats }: SeatPlanMappingCardProps) {
  const queryClient = useQueryClient();
  const [planId, setPlanId] = useState("");
  const [mapAll, setMapAll] = useState(true);
  const [fromSeat, setFromSeat] = useState("1");
  const [toSeat, setToSeat] = useState(totalSeats ? String(totalSeats) : "");
  const [shiftA, setShiftA] = useState(true);
  const [shiftB, setShiftB] = useState(true);
  const [restrictToRange, setRestrictToRange] = useState(true);

  const { data: plans } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({ isActive: "true" }),
  });

  const selectedPlan = plans?.items?.find((p) => getPlanId(p) === planId);
  const shiftBased = isShiftBasedPlan(selectedPlan);

  const mutation = useMutation({
    mutationFn: () => {
      if (!planId) throw new Error("Select a plan");
      const payload = {
        branchId,
        planId,
        ...(mapAll
          ? { mapAll: true as const }
          : {
              fromSeat: Number(fromSeat),
              toSeat: Number(toSeat),
            }),
        ...(shiftBased && {
          allowedShiftCodes: [
            ...(shiftA ? (["A"] as const) : []),
            ...(shiftB ? (["B"] as const) : []),
          ],
        }),
        isEnabled: true,
        ...(!mapAll && { restrictToRange }),
      };
      return seatsService.bulkMapPlan(payload);
    },
    onSuccess: (result) => {
      const unmapped =
        result.unmapped && result.unmapped > 0
          ? `; ${result.unmapped} seat(s) removed from this plan outside the range`
          : "";
      toast.success(
        `${result.mapped} seat(s) mapped to ${result.planName ?? "plan"}${unmapped}`
      );
      queryClient.invalidateQueries({ queryKey: ["seats"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiClientError ? err.message : "Failed to map seats"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Plan mapping</CardTitle>
        <CardDescription>
          Seats are auto-created from branch capacity (1–{totalSeats ?? "N"}).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2 min-w-[200px]">
          <Label>Plan</Label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {(plans?.items ?? []).map((p) => {
                const id = getPlanId(p);
                return (
                  <SelectItem key={id} value={id}>
                    {getPlanLabel(p)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 pb-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            className="rounded border-input"
            checked={mapAll}
            onChange={(e) => setMapAll(e.target.checked)}
          />
          All seats in branch
        </label>

        {!mapAll && (
          <>
            <div className="space-y-2 w-24">
              <Label>From seat</Label>
              <Input type="number" min={1} value={fromSeat} onChange={(e) => setFromSeat(e.target.value)} />
            </div>
            <div className="space-y-2 w-24">
              <Label>To seat</Label>
              <Input type="number" min={1} value={toSeat} onChange={(e) => setToSeat(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 pb-2 cursor-pointer text-sm max-w-xs">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={restrictToRange}
                onChange={(e) => setRestrictToRange(e.target.checked)}
              />
              Only this range for plan (unmap seats outside)
            </label>
          </>
        )}

        {shiftBased && (
          <div className="flex gap-4 pb-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={shiftA}
                onChange={(e) => setShiftA(e.target.checked)}
              />
              Shift {SHIFT_CODES[0]}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-input"
                checked={shiftB}
                onChange={(e) => setShiftB(e.target.checked)}
              />
              Shift {SHIFT_CODES[1]}
            </label>
          </div>
        )}

        <Button
          disabled={!planId || mutation.isPending || (shiftBased && !shiftA && !shiftB)}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? "Mapping..." : "Apply mapping"}
        </Button>
      </CardContent>
    </Card>
  );
}
