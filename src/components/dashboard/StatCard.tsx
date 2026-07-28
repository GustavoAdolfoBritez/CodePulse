import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react";
import { Sparkline } from "@/components/charts/Sparkline";
import { cn } from "@/lib/utils";

export type DeltaType =
  | "increase"
  | "moderateIncrease"
  | "decrease"
  | "moderateDecrease"
  | "unchanged";

interface StatCardProps {
  title: string;
  metric: string;
  delta?: string;
  deltaType?: DeltaType;
  icon?: LucideIcon;
  trend?: number[];
}

const deltaStyles: Record<DeltaType, { text: string; icon: "up" | "down" | "none" }> = {
  increase: { text: "text-emerald-600 dark:text-emerald-400", icon: "up" },
  moderateIncrease: { text: "text-emerald-600 dark:text-emerald-400", icon: "up" },
  decrease: { text: "text-rose-600 dark:text-rose-400", icon: "down" },
  moderateDecrease: { text: "text-rose-600 dark:text-rose-400", icon: "down" },
  unchanged: { text: "text-zinc-500 dark:text-zinc-400", icon: "none" },
};

const sparklineColor: Record<DeltaType, "emerald" | "rose" | "zinc"> = {
  increase: "emerald",
  moderateIncrease: "emerald",
  decrease: "rose",
  moderateDecrease: "rose",
  unchanged: "zinc",
};

export function StatCard({
  title,
  metric,
  delta,
  deltaType = "unchanged",
  icon: Icon,
  trend,
}: StatCardProps) {
  const { text: deltaColor, icon: deltaIcon } = deltaStyles[deltaType];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </span>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0 text-zinc-300 dark:text-zinc-600" />
        ) : null}
      </div>

      <div className="mt-4 flex flex-1 items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
            {metric}
          </p>
          {delta ? (
            <p className={cn("mt-2 flex min-h-5 items-center gap-1 text-xs font-medium", deltaColor)}>
              {deltaIcon === "up" ? <ArrowUp className="h-3 w-3" /> : null}
              {deltaIcon === "down" ? <ArrowDown className="h-3 w-3" /> : null}
              {delta}
              <span className="font-normal text-zinc-400 dark:text-zinc-500">
                vs semana anterior
              </span>
            </p>
          ) : (
            <div className="mt-2 min-h-5" aria-hidden />
          )}
        </div>

        {trend ? (
          <Sparkline data={trend} color={sparklineColor[deltaType]} className="shrink-0" />
        ) : null}
      </div>
    </div>
  );
}
