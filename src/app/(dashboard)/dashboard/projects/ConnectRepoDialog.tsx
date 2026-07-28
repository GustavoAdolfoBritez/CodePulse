"use client";

import { useEffect, useRef, useState } from "react";
import { FolderGit2, GitBranch, Loader2, Plus, Search, X } from "lucide-react";
import { createProjectAction } from "./actions";
import { initialActionState, type ActionState } from "./action-types";

interface GithubRepoOption {
  id: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  private: boolean;
  language: string | null;
}

interface GithubReposResponse {
  configured: boolean;
  linked?: boolean;
  repos: GithubRepoOption[];
  error?: string;
}

export function ConnectRepoDialog() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<ActionState>(initialActionState);
  const [reposLoading, setReposLoading] = useState(false);
  const [reposConfigured, setReposConfigured] = useState(false);
  const [reposLinked, setReposLinked] = useState(false);
  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState("");
  const [mode, setMode] = useState<"picker" | "manual">("manual");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadRepos() {
      setReposLoading(true);
      try {
        const response = await fetch("/api/github/repos");
        if (!response.ok) {
          throw new Error("Failed to load repos");
        }
        const data = (await response.json()) as GithubReposResponse;
        if (cancelled) {
          return;
        }

        setReposConfigured(data.configured);
        setReposLinked(Boolean(data.linked));
        setRepos(data.repos ?? []);

        if (data.configured && data.repos.length > 0) {
          setMode("picker");
          setSelectedRepo(data.repos[0]?.htmlUrl ?? "");
        } else {
          setMode("manual");
        }
      } catch {
        if (!cancelled) {
          setReposConfigured(false);
          setMode("manual");
        }
      } finally {
        if (!cancelled) {
          setReposLoading(false);
        }
      }
    }

    void loadRepos();

    return () => {
      cancelled = true;
    };
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await createProjectAction(initialActionState, formData);
    setPending(false);
    setState(result);
    if (result.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }

  const filteredRepos = repos.filter((repo) => {
    const query = repoSearch.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return (
      repo.fullName.toLowerCase().includes(query) ||
      (repo.description?.toLowerCase().includes(query) ?? false)
    );
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setState(initialActionState);
          setRepoSearch("");
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
      >
        <Plus className="h-4 w-4" />
        Conectar repositorio
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                  <FolderGit2 className="h-4.5 w-4.5 text-zinc-600 dark:text-zinc-300" />
                </span>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-white">
                  Conectar nuevo repositorio de GitHub
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reposLoading ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando repositorios de GitHub...
              </div>
            ) : null}

            {!reposLoading && reposConfigured && repos.length > 0 ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("picker")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    mode === "picker"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  Mis repos
                </button>
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    mode === "manual"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  URL manual
                </button>
              </div>
            ) : null}

            {!reposLoading && reposConfigured && !reposLinked ? (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                Inicia sesión con GitHub para listar tus repos automáticamente, o usa la entrada manual.
              </p>
            ) : null}

            <form ref={formRef} onSubmit={handleSubmit} className="mt-4 space-y-3">
              {mode === "picker" && repos.length > 0 ? (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="search"
                      value={repoSearch}
                      onChange={(event) => setRepoSearch(event.target.value)}
                      placeholder="Buscar repositorio..."
                      className="block w-full rounded-lg border-zinc-200 bg-white py-2 pl-10 pr-3 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                  <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
                    {filteredRepos.map((repo) => (
                      <label
                        key={repo.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          selectedRepo === repo.htmlUrl
                            ? "border-indigo-500 bg-indigo-50/60 dark:border-indigo-400 dark:bg-indigo-950/30"
                            : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="repoChoice"
                          value={repo.htmlUrl}
                          checked={selectedRepo === repo.htmlUrl}
                          onChange={() => setSelectedRepo(repo.htmlUrl)}
                          className="mt-1 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <GitBranch className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="truncate text-sm font-medium text-zinc-900 dark:text-white">
                              {repo.fullName}
                            </span>
                            {repo.private ? (
                              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                Private
                              </span>
                            ) : null}
                          </span>
                          {repo.description ? (
                            <span className="mt-1 block truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {repo.description}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    ))}
                    {filteredRepos.length === 0 ? (
                      <p className="px-2 py-4 text-center text-xs text-zinc-400">
                        No hay repos que coincidan con la búsqueda.
                      </p>
                    ) : null}
                  </div>
                  <input type="hidden" name="input" value={selectedRepo} />
                </>
              ) : (
                <>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Ingresa la URL del repositorio o el formato{" "}
                    <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
                      owner/repo
                    </code>
                    . Se encolará un análisis automático apenas se conecte.
                  </p>
                  <div>
                    <label
                      htmlFor="input"
                      className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      Repositorio
                    </label>
                    <input
                      id="input"
                      name="input"
                      type="text"
                      required
                      placeholder="vercel/next.js o https://github.com/vercel/next.js"
                      className="block w-full rounded-lg border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    />
                  </div>
                </>
              )}

              {state.error ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                  {state.error}
                </p>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pending || (mode === "picker" && !selectedRepo)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Conectar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
