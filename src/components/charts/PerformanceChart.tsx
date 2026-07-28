"use client";

import { AreaChart, Card } from "@tremor/react";
import { Activity, ArrowDown, ArrowUp } from "lucide-react";
import type { PerformanceDataPoint } from "@/types";
import type { DeltaType } from "@/components/dashboard/StatCard";

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  title?: string;
  metricLabel?: string;
  metricSuffix?: string;
  categories?: string[];
  colors?: string[];
  delta?: string;
  deltaType?: DeltaType;
  rangeLabel?: string;
  valueFormatter?: (value: number) => string;
}

export function PerformanceChart({
  data,
  title = "Rendimiento de la API",
  metricLabel = "Latencia p95 (ms)",
  metricSuffix = "ms",
  categories = ["Latencia p95 (ms)", "Errores"],
  colors = ["indigo", "rose"],
  delta = "+3% vs. semana anterior",
  deltaType = "increase",
  rangeLabel = "Últimas 8 semanas",
  valueFormatter = (value: number) => value.toLocaleString("en-US"),
}: PerformanceChartProps) {
  const latestValue = data[data.length - 1]?.[metricLabel];
  const latest = typeof latestValue === "number" ? latestValue : 0;
  const deltaTone =
    deltaType === "decrease" || deltaType === "moderateDecrease"
      ? "text-rose-600 dark:text-rose-400"
      : deltaType === "unchanged"
        ? "text-zinc-500 dark:text-zinc-400"
        : "text-emerald-600 dark:text-emerald-400";
  const DeltaIcon =
    deltaType === "decrease" || deltaType === "moderateDecrease"
      ? ArrowDown
      : deltaType === "unchanged"
        ? null
        : ArrowUp;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {title}
          </span>
        </div>
        <span className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          {rangeLabel}
        </span>
      </div>

      <div className="mt-5 flex items-baseline gap-3">
        <p className="text-3xl font-semibold tabular-nums text-zinc-900 dark:text-white">
          {valueFormatter(latest)} {metricSuffix}
        </p>
        <span className={`flex items-center gap-1 text-xs font-medium ${deltaTone}`}>
          {DeltaIcon ? <DeltaIcon className="h-3 w-3" /> : null}
          {delta}
        </span>
      </div>

      <AreaChart
        className="mt-6 h-72"
        data={data}
        index="date"
        categories={categories}
        colors={colors}
        valueFormatter={valueFormatter}
        showLegend
        showAnimation
      />
    </Card>
  );
}
