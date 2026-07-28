import Link from "next/link";
import { Zap } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";
import { InviteAcceptPanel } from "./InviteAcceptPanel";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const session = await auth();

  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token },
    include: { organization: true },
  });

  if (!invitation || invitation.expiresAt < new Date()) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Invitación no válida</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            El enlace expiró o fue revocado. Pide una nueva invitación al administrador de tu equipo.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const sessionEmail = session?.user?.email ?? null;
  const emailMatches =
    Boolean(sessionEmail) &&
    sessionEmail!.toLowerCase() === invitation.email.toLowerCase();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Zap className="h-5 w-5" fill="currentColor" />
          </span>
          <div>
            <p className="text-base font-semibold text-zinc-900 dark:text-white">{siteConfig.name}</p>
            <p className="text-xs text-zinc-400">Invitación a equipo</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Te invitaron a unirte</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Acepta la invitación para colaborar en el espacio de trabajo de tu equipo.
        </p>

        <div className="mt-6">
          <InviteAcceptPanel
            token={token}
            organizationName={invitation.organization.name}
            invitedEmail={invitation.email}
            role={invitation.role}
            isAuthenticated={Boolean(session?.user)}
            sessionEmail={sessionEmail}
            emailMatches={emailMatches}
          />
        </div>
      </div>
    </main>
  );
}
