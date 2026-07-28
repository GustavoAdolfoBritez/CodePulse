import { Header } from "@/components/layout/Header";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  revokeInvitationAction,
  rotateWebhookKeyAction,
  sendInvitationAction,
  signOutAction,
  switchOrganizationAction,
  updateOrganizationAction,
  updateProfileAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface SettingsPageProps {
  searchParams: Promise<{ inviteError?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const params = await searchParams;
  const context = await getCurrentOrganizationContext();
  const canManageOrganization = context!.activeRole === "OWNER" || context!.activeRole === "ADMIN";

  const [members, pendingInvitations] = await Promise.all([
    prisma.organizationMembership.findMany({
      where: { organizationId: context!.organization.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.organizationInvitation.findMany({
      where: { organizationId: context!.organization.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <Header
        eyebrow="Administración"
        title="Settings"
        subtitle="Gestiona tu perfil, la organización activa y los miembros del espacio."
      />

      <div className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Perfil</h2>
            <form action={updateProfileAction} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Nombre
                </label>
                <input
                  name="name"
                  defaultValue={context!.user.name ?? ""}
                  className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Email
                </label>
                <input
                  value={context!.user.email}
                  disabled
                  className="block w-full rounded-xl border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Rol activo
                </label>
                <input
                  value={context!.activeRole}
                  disabled
                  className="block w-full rounded-xl border-zinc-200 bg-zinc-50 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Guardar perfil
              </button>
            </form>
            <form action={signOutAction} className="mt-3">
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cerrar sesión
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Organización activa</h2>
            <form action={updateOrganizationAction} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Nombre
                </label>
                <input
                  name="organizationName"
                  defaultValue={context!.organization.name}
                  disabled={!canManageOrganization}
                  className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Webhook API Key
                </label>
                <input
                  name="webhookApiKey"
                  defaultValue={context!.organization.webhookApiKey ?? ""}
                  disabled={!canManageOrganization}
                  className="block w-full rounded-xl border-zinc-200 bg-white font-mono text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={!canManageOrganization}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  Guardar organización
                </button>
              </div>
            </form>
            <form action={rotateWebhookKeyAction} className="mt-3">
              <button
                type="submit"
                disabled={!canManageOrganization}
                className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Rotar API key
              </button>
            </form>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Cambiar de organización</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Selecciona el espacio activo para cambiar el scope de proyectos, métricas e insights.
            </p>
            <form action={switchOrganizationAction} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-[280px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Organización activa
                </label>
                <select
                  name="organizationId"
                  defaultValue={context!.organization.id}
                  className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                >
                  {context!.memberships.map((membership) => (
                    <option key={membership.organizationId} value={membership.organizationId}>
                      {membership.organization.name} ({membership.role})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Cambiar
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Invitar por email</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Envía una invitación con enlace único. El invitado podrá registrarse o unirse con su cuenta.
            </p>
            <form action={sendInvitationAction} className="mt-4 grid grid-cols-1 gap-3">
              <input
                name="email"
                type="email"
                placeholder="email@empresa.com"
                required
                disabled={!canManageOrganization}
                className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              />
              <select
                name="role"
                defaultValue="MEMBER"
                disabled={!canManageOrganization}
                className="block w-full rounded-xl border-zinc-200 bg-white text-sm text-zinc-900 focus:border-indigo-500 focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="MEMBER">MEMBER</option>
              </select>
              <button
                type="submit"
                disabled={!canManageOrganization}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Enviar invitación
              </button>
            </form>
            {params.inviteError ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                {params.inviteError}
              </p>
            ) : null}
            {!canManageOrganization ? (
              <p className="mt-3 text-xs text-zinc-400">
                Solo OWNER/ADMIN pueden editar la organización o administrar invitaciones.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Invitaciones pendientes</h2>
          </div>
          {pendingInvitations.length === 0 ? (
            <p className="px-6 py-8 text-sm text-zinc-500 dark:text-zinc-400">
              No hay invitaciones pendientes.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">{invitation.email}</p>
                    <p className="text-xs text-zinc-400">
                      Rol {invitation.role} · expira{" "}
                      {formatDistanceToNow(invitation.expiresAt, { addSuffix: true, locale: es })}
                    </p>
                    <p className="mt-1 break-all font-mono text-[11px] text-zinc-400">
                      {appUrl}/invite/{invitation.token}
                    </p>
                  </div>
                  {canManageOrganization ? (
                    <form action={revokeInvitationAction}>
                      <input type="hidden" name="invitationId" value={invitation.id} />
                      <button
                        type="submit"
                        className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        Revocar
                      </button>
                    </form>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Miembros de la organización</h2>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4 px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {member.user.name ?? "Sin nombre"}
                  </p>
                  <p className="text-xs text-zinc-400">{member.user.email}</p>
                </div>
                <span className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
