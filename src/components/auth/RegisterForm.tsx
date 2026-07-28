"use client";

import { useActionState } from "react";
import { FolderGit2, Loader2 } from "lucide-react";
import { initialAuthFormState } from "@/app/(auth)/auth-state";
import { loginWithGitHubAction, registerAction } from "@/app/(auth)/actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialAuthFormState);

  return (
    <div className="space-y-4">
      <form action={loginWithGitHubAction}>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FolderGit2 className="h-4 w-4" />
          Registrarme con GitHub
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900">o crear cuenta local</span>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="name">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>
        <div>
          <label
            className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400"
            htmlFor="password"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
          />
        </div>

        {state.error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Crear cuenta
        </button>
      </form>

      <p className="text-xs text-zinc-400">
        Después del registro configurarás tu organización en el flujo de onboarding. Usa al menos 8
        caracteres con letras y números.
      </p>
    </div>
  );
}
