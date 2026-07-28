interface SparklineProps {
  data: number[];
  color?: "emerald" | "rose" | "zinc";
  className?: string;
}

const strokeByColor: Record<NonNullable<SparklineProps["color"]>, string> = {
  emerald: "stroke-emerald-500 dark:stroke-emerald-400",
  rose: "stroke-rose-500 dark:stroke-rose-400",
  zinc: "stroke-zinc-400 dark:stroke-zinc-500",
};

/**
 * Minimal inline trend indicator for StatCard. Intentionally dependency-free
 * (plain SVG) since Tremor v3 doesn't ship a spark chart component.
 */
export function Sparkline({ data, color = "emerald", className }: SparklineProps) {
  const width = 96;
  const height = 32;
  const padding = 3;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      width={width}
      height={height}
      fill="none"
      aria-hidden="true"
    >
      <polyline
        points={points.join(" ")}
        className={strokeByColor[color]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
