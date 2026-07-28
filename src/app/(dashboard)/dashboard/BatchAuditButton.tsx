"use client";

import { useActionState } from "react";
import { Loader2, PlayCircle } from "lucide-react";
import { runGlobalAuditAction } from "./actions";
import { initialBatchAuditState } from "./batch-audit-state";

export function BatchAuditButton() {
  const [state, formAction, pending] = useActionState(runGlobalAuditAction, initialBatchAuditState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
        Ejecutar Auditoría Global
      </button>

      {state.error ? <p className="text-xs text-rose-500">{state.error}</p> : null}
      {state.success && state.message ? <p className="text-xs text-emerald-500">{state.message}</p> : null}
    </form>
  );
}
