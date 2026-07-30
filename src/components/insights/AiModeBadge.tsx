import { cn } from "@/lib/utils";

type AiMode = "LLM" | "HEURISTIC" | null | undefined;

export function AiModeBadge({ mode }: { mode: AiMode }) {
  if (!mode) {
    return null;
  }

  const isLive = mode === "LLM";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        isLive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
      )}
      title={
        isLive
          ? "Informe generado con el modelo de IA configurado"
          : "Informe generado con heurísticas locales (sin LLM o tras un fallo del proveedor)"
      }
    >
      {isLive ? "IA en vivo" : "Heurístico"}
    </span>
  );
}
