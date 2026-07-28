import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400 ring-emerald-200 dark:ring-emerald-900";
  if (score >= 70) return "text-sky-600 dark:text-sky-400 ring-sky-200 dark:ring-sky-900";
  if (score >= 50) return "text-amber-600 dark:text-amber-400 ring-amber-200 dark:ring-amber-900";
  if (score >= 30) return "text-orange-600 dark:text-orange-400 ring-orange-200 dark:ring-orange-900";
  return "text-rose-600 dark:text-rose-400 ring-rose-200 dark:ring-rose-900";
}

interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "lg";
}

/** Circular "AI Score" pill, e.g. 82/100, colored by health band. */
export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return (
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full text-xs text-zinc-400 ring-1 ring-inset ring-zinc-200 dark:text-zinc-500 dark:ring-zinc-800">
        —
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold tabular-nums ring-1 ring-inset",
        scoreTone(score),
        size === "lg" ? "h-16 w-16 text-xl" : "h-9 w-9 text-xs"
      )}
      title={`AI Score: ${score}/100`}
    >
      {score}
    </span>
  );
}
