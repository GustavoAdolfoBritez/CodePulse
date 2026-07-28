"use client";

import { useActionState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { triggerAnalysisAction } from "./actions";
import { initialActionState } from "./action-types";

export function AnalyzeButton({ projectId }: { projectId: string }) {
  const [state, formAction, pending] = useActionState(triggerAnalysisAction, initialActionState);

  return (
    <form action={formAction}>
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
        Analizar ahora
      </button>
      {state.error ? <p className="mt-1 text-xs text-rose-500">{state.error}</p> : null}
    </form>
  );
}
