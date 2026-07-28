"use client";

import { AreaChart, Card } from "@tremor/react";
import { Activity, ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
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

/**
 * "Hello World" chart used to validate the Tremor + Tailwind setup.
 * Once real analysis jobs run, this will be fed by AnalysisResult rows
 * fetched from Postgres via Prisma.
 */
export function PerformanceChart({
  data,
  title = "Rendimiento de la API",
  metricLabel = "Latencia p95 (ms)",
  metricSuffix = "ms",
  categories = ["Latencia p95 (ms)", "Errores"],
  colors = ["indigo", "rose"],
  delta = "+3% vs. semana anterior",
  deltaType = "increase",
  rangeLabel = "Últimos 7 días",
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {title}
          </span>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {rangeLabel}
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </button>
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
