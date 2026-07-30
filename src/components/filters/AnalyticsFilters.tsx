import Link from "next/link";
import type { AnalyticsFilters } from "@/lib/analytics-filters";

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  showSearch?: boolean;
}

export function AnalyticsFilters({ filters, showSearch = true }: AnalyticsFiltersProps) {
  return (
    <form className="flex w-full flex-col flex-wrap items-stretch gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-end">
      {showSearch ? (
        <div className="min-w-0 flex-1 sm:min-w-[200px]">
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="q">
            Búsqueda
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filters.q}
            placeholder="Repo, URL o API"
            className="block w-full rounded-lg border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>
      ) : null}

      <div className="min-w-0 sm:min-w-[150px]">
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
          htmlFor="severity"
        >
          Severidad
        </label>
        <select
          id="severity"
          name="severity"
          defaultValue={filters.severity}
          className="block w-full rounded-lg border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        >
          <option value="">Todas</option>
          <option value="LOW">LOW</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HIGH">HIGH</option>
          <option value="CRITICAL">CRITICAL</option>
        </select>
      </div>

      <div className="min-w-0 sm:min-w-[150px]">
        <label
          className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
          htmlFor="sourceType"
        >
          Tipo
        </label>
        <select
          id="sourceType"
          name="sourceType"
          defaultValue={filters.sourceType}
          className="block w-full rounded-lg border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
        >
          <option value="">Todos</option>
          <option value="GITHUB_REPO">GitHub</option>
          <option value="API_ENDPOINT">API</option>
        </select>
      </div>

      <div className="flex w-full items-center gap-2 sm:w-auto">
        <button
          type="submit"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-500 sm:flex-none"
        >
          Filtrar
        </button>
        <Link
          href="?"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:flex-none"
        >
          Limpiar
        </Link>
      </div>
    </form>
  );
}
