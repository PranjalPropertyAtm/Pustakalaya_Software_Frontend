import { useEffect, useState } from "react";
import { ChartSkeleton } from "@/components/shared/ChartSkeleton";

export { CHART_COLORS } from "./chartConstants";
export { ChartLegend } from "./ChartLegend";

type ChartModule = typeof import("./DashboardCharts");

let chartModulePromise: Promise<ChartModule> | null = null;

function loadChartModule(): Promise<ChartModule> {
  chartModulePromise ??= import("./DashboardCharts");
  return chartModulePromise;
}

function useChartModule() {
  const [mod, setMod] = useState<ChartModule | null>(null);

  useEffect(() => {
    let active = true;
    void loadChartModule().then((loaded) => {
      if (active) setMod(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return mod;
}

interface LazyBarChartProps {
  data: { name: string; value: number }[];
  emptyLabel?: string;
  className?: string;
}

export function LazyBarChart({ data, emptyLabel, className }: LazyBarChartProps) {
  const charts = useChartModule();
  const Panel = charts?.DashboardBarChartPanel;
  return (
    <div className={className ?? "h-[260px] w-full"}>
      {Panel ? <Panel data={data} emptyLabel={emptyLabel} /> : <ChartSkeleton />}
    </div>
  );
}

export function LazyPieChart({ data, emptyLabel, className }: LazyBarChartProps) {
  const charts = useChartModule();
  const Panel = charts?.DashboardPieChartPanel;
  return (
    <div className={className ?? "h-[260px] w-full"}>
      {Panel ? <Panel data={data} emptyLabel={emptyLabel} /> : <ChartSkeleton />}
    </div>
  );
}

export function LazyOccupancyChart({
  occupancyValue,
  className,
}: {
  occupancyValue: number;
  className?: string;
}) {
  const charts = useChartModule();
  const Panel = charts?.DashboardOccupancyChart;
  return (
    <div className={className ?? "h-[200px] w-full"}>
      {Panel ? <Panel occupancyValue={occupancyValue} /> : <ChartSkeleton />}
    </div>
  );
}

export function LazyComparisonBarChart({
  data,
  className,
}: {
  data: { branchName: string; active: number; expired: number }[];
  className?: string;
}) {
  const charts = useChartModule();
  const Panel = charts?.ComparisonBarChartPanel;
  return (
    <div className={className ?? "h-[280px] w-full"}>
      {Panel ? <Panel data={data} /> : <ChartSkeleton />}
    </div>
  );
}

export { ChartSkeleton };
