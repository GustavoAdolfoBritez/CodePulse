"use client";

import { useActionState } from "react";
import Link from "next/link";
import { FolderGit2, Loader2, Mail, Users } from "lucide-react";
import { initialAuthFormState } from "@/app/(auth)/auth-state";
import { registerWithInviteAction } from "@/app/(auth)/actions";
import { acceptInviteAction, loginWithInviteAction } from "@/app/(dashboard)/dashboard/settings/actions";

interface InviteAcceptPanelProps {
  token: string;
  organizationName: string;
  invitedEmail: string;
  role: string;
  isAuthenticated: boolean;
  sessionEmail: string | null;
  emailMatches: boolean;
}

export function InviteAcceptPanel({
  token,
  organizationName,
  invitedEmail,
  role,
  isAuthenticated,
  sessionEmail,
  emailMatches,
}: InviteAcceptPanelProps) {
  const [state, formAction, pending] = useActionState(registerWithInviteAction, initialAuthFormState);

  if (isAuthenticated && emailMatches) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sesión activa como <span className="font-medium text-zinc-900 dark:text-white">{sessionEmail}</span>.
          Acepta la invitación para unirte a la organización.
        </p>
        <form action={acceptInviteAction}>
          <input type="hidden" name="token" value={token} />
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Users className="h-4 w-4" />
            Unirme a {organizationName}
          </button>
        </form>
      </div>
    );
  }

  if (isAuthenticated && !emailMatches) {
    return (
      <div className="space-y-4">
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          Estás conectado como {sessionEmail}, pero la invitación fue enviada a {invitedEmail}. Cierra sesión e
          ingresa con el email correcto.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
          className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Cambiar cuenta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">{organizationName}</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Te invitaron como <span className="font-medium">{role}</span> con el email{" "}
              <span className="font-medium">{invitedEmail}</span>.
            </p>
          </div>
        </div>
      </div>

      <form action={loginWithInviteAction}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          <FolderGit2 className="h-4 w-4" />
          Continuar con GitHub
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-900">o crear cuenta</span>
        </div>
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="token" value={token} />
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
            readOnly
            defaultValue={invitedEmail}
            className="block w-full rounded-xl border-zinc-200 bg-zinc-50 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
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
          Crear cuenta y unirme
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
          className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
