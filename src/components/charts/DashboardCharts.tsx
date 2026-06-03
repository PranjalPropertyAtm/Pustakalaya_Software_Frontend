import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { typography } from "@/lib/typography";
import { cn } from "@/lib/utils";
import { CHART_COLORS } from "./chartConstants";

export { CHART_COLORS } from "./chartConstants";

interface ComparisonBarChartProps {
  data: { branchName: string; active: number; expired: number }[];
}

export function ComparisonBarChartPanel({ data }: ComparisonBarChartProps) {
  if (data.length === 0) {
    return (
      <p className={cn(typography.paginationMeta, "flex h-full items-center justify-center")}>
        No comparison data
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="branchName" tick={typography.chartTick} stroke="#94a3b8" />
        <YAxis tick={typography.chartTick} stroke="#94a3b8" />
        <Tooltip />
        <Bar dataKey="active" name="Active" fill="#5cb811" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expired" name="Expired" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface BarChartPanelProps {
  data: { name: string; value: number }[];
  emptyLabel?: string;
}

export function DashboardBarChartPanel({ data, emptyLabel = "No data available" }: BarChartPanelProps) {
  if (data.length === 0) {
    return (
      <p className={cn(typography.paginationMeta, "flex h-full items-center justify-center")}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
        <XAxis dataKey="name" tick={typography.chartTick} stroke="#94a3b8" />
        <YAxis tick={typography.chartTick} stroke="#94a3b8" />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid var(--color-border)",
            fontSize: 12,
            fontWeight: 500,
          }}
          formatter={(v) => [Number(v ?? 0), "Students"]}
        />
        <Bar dataKey="value" fill="#e87d1e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface PieChartPanelProps {
  data: { name: string; value: number }[];
  emptyLabel?: string;
}

export function DashboardPieChartPanel({ data, emptyLabel = "No plan data" }: PieChartPanelProps) {
  if (data.length === 0) {
    return (
      <p className={cn(typography.paginationMeta, "flex h-full items-center justify-center")}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={85}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface OccupancyBarProps {
  occupancyValue: number;
}

export function DashboardOccupancyChart({ occupancyValue }: OccupancyBarProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={[
          { name: "Occupied", value: occupancyValue },
          { name: "Available", value: Math.max(0, 100 - occupancyValue) },
        ]}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={typography.chartTick} />
        <YAxis type="category" dataKey="name" width={80} tick={typography.chartTick} />
        <Tooltip formatter={(v) => [`${Number(v ?? 0)}%`, ""]} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          <Cell fill="#f97316" />
          <Cell fill="#22c55e" />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
