import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { seatsService, plansService } from "@/api/services";
import { queryKeys } from "@/lib/queryKeys";
import { useBranchContext } from "@/hooks/useBranchContext";
import { PageHeader } from "@/components/common/PageHeader";
import { SeatGrid, SeatLegend } from "@/components/seats/SeatGrid";
import { StatsCard } from "@/components/shared/StatsCard";
import { SectionCard } from "@/components/shared/SectionCard";
import { SeatPlanMappingCard } from "@/components/seats/SeatPlanMappingCard";
import { branchesService } from "@/api/services";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SHIFT_CODES } from "@/lib/constants";
import { getPlanId, getPlanLabel, isShiftBasedPlan } from "@/lib/plan";
import { Grid3X3 } from "lucide-react";

export default function SeatsPage() {
  const { effectiveBranchId } = useBranchContext();

  const { data: branch } = useQuery({
    queryKey: queryKeys.branches.list({ id: effectiveBranchId }),
    queryFn: () => branchesService.getById(effectiveBranchId!),
    enabled: !!effectiveBranchId,
  });
  const [planId, setPlanId] = useState<string>("");
  const [shiftCode, setShiftCode] = useState<string>("A");

  const { data: plans } = useQuery({
    queryKey: queryKeys.plans.list({}),
    queryFn: () => plansService.list({ isActive: "true" }),
  });

  const selectedPlan = plans?.items?.find((p) => getPlanId(p) === planId);
  const shiftBased = isShiftBasedPlan(selectedPlan);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.seats.availability({
      branchId: effectiveBranchId!,
      planId: planId || undefined,
      shiftCode: shiftBased ? shiftCode : undefined,
    }),
    queryFn: () =>
      seatsService.availability({
        branchId: effectiveBranchId!,
        planId,
        ...(shiftBased && shiftCode ? { shiftCode } : {}),
      }),
    enabled: !!effectiveBranchId && !!planId,
  });

  const occupied = data?.filter((s) => !s.available && s.liveStatus === "occupied").length ?? 0;
  const vacant = data?.filter((s) => s.available).length ?? 0;
  const reserved = data?.filter((s) => s.liveStatus === "reserved").length ?? 0;
  const total = data?.length ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader title="Seat Map" description="Live seat availability for the selected branch" />
      {effectiveBranchId && (
        <SeatPlanMappingCard branchId={effectiveBranchId} totalSeats={branch?.totalSeats} />
      )}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-2 min-w-[180px]">
          <Label>Plan</Label>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
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
        {shiftBased && (
          <div className="space-y-2 min-w-[120px]">
            <Label>Shift (6hr only)</Label>
            <Select value={shiftCode} onValueChange={setShiftCode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHIFT_CODES.map((s) => (
                  <SelectItem key={s} value={s}>Shift {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {selectedPlan && !shiftBased && (
          <p className="text-sm text-muted-foreground pb-2">
            {selectedPlan.name} plan: full seat — shift not required
          </p>
        )}
        <SeatLegend shiftCode={shiftBased ? shiftCode : undefined} />
      </div>

      {planId && !isLoading && !isError && total > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total seats" value={total} icon={Grid3X3} accent="neutral" />
          <StatsCard title="Vacant" value={vacant} icon={Grid3X3} accent="secondary" />
          <StatsCard title="Occupied" value={occupied} icon={Grid3X3} accent="primary" />
          <StatsCard title="Reserved" value={reserved} icon={Grid3X3} accent="neutral" />
        </div>
      )}

      {!planId ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">Select a plan to view the seat map</CardContent></Card>
      ) : isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <SectionCard title="Seat layout" description={`${vacant} available · ${occupied} occupied · ${reserved} reserved`}>
            {(data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No seats mapped to this plan. Use the mapping section above to assign seats.
              </p>
            ) : (
              <SeatGrid
                items={data ?? []}
                shiftCode={shiftBased ? shiftCode : undefined}
                planName={selectedPlan?.name}
              />
            )}
        </SectionCard>
      )}
    </div>
  );
}
