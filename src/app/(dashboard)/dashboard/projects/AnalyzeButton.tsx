"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { triggerAnalysisAction } from "./actions";
import { initialActionState } from "./action-types";

export function AnalyzeButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(triggerAnalysisAction, initialActionState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="projectId" value={projectId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        title={state.error ?? undefined}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {pending ? "Analizando…" : "Analizar ahora"}
      </button>
      {state.error ? <p className="text-xs text-rose-500">{state.error}</p> : null}
      {state.success && !pending ? (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">Análisis listo</p>
      ) : null}
    </form>
  );
}
