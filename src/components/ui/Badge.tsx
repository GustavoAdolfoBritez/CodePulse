import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeColor =
  | "zinc"
  | "sky"
  | "emerald"
  | "amber"
  | "orange"
  | "rose";

const colorStyles: Record<BadgeColor, string> = {
  zinc: "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  sky: "bg-sky-50 text-sky-600 ring-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-900",
  emerald:
    "bg-emerald-50 text-emerald-600 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-900",
  amber:
    "bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-900",
  orange:
    "bg-orange-50 text-orange-600 ring-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:ring-orange-900",
  rose: "bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:ring-rose-900",
};

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** Small, soft-bordered status pill used across the Projects/Insights UI. */
export function Badge({ color = "zinc", children, icon, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        colorStyles[color],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}
