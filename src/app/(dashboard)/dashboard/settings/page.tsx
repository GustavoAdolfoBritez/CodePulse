import { Header } from "@/components/layout/Header";
import { CopyField } from "@/components/settings/CopyField";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";
import { generateWebhookApiKey } from "@/lib/organizations";
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
  const isOwner = context!.activeRole === "OWNER";

  let webhookSecret = context!.organization.webhookApiKey;
  if (!webhookSecret && canManageOrganization) {
    webhookSecret = generateWebhookApiKey();
    await prisma.organization.update({
      where: { id: context!.organization.id },
      data: { webhookApiKey: webhookSecret },
    });
  }

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

  const payloadUrl = `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://code-pulse-delta.vercel.app").replace(/\/$/, "")}/api/webhooks/github`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://code-pulse-delta.vercel.app").replace(
    /\/$/,
    ""
  );

  return (
    <>
      <Header
        eyebrow="Administración"
        title="Settings"
        subtitle="Gestiona tu perfil, la organización activa y los miembros del espacio."
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
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

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
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
              <button
                type="submit"
                disabled={!canManageOrganization}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Guardar organización
              </button>
            </form>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Webhook de GitHub (análisis automático)
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Conectá tu repositorio en CodePulse y después creá un webhook en GitHub para que cada
            push o pull request dispare una auditoría sola.
          </p>

          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
            <li>
              En GitHub abrí el repo → <strong>Settings</strong> → <strong>Webhooks</strong> →{" "}
              <strong>Add webhook</strong>.
            </li>
            <li>
              Pegá la <strong>Payload URL</strong> de abajo.
            </li>
            <li>
              Content type: <strong>application/json</strong>.
            </li>
            <li>
              En <strong>Secret</strong> pegá el valor de abajo (empieza con{" "}
              <code className="text-xs">cp_wh_</code>).{" "}
              <span className="text-amber-700 dark:text-amber-300">
                No escribas nombres de variables como GITHUB_WEBHOOK_SECRET.
              </span>
            </li>
            <li>
              Elegí <strong>Let me select individual events</strong> y marcá{" "}
              <strong>Pushes</strong> + <strong>Pull requests</strong> (o al menos Pushes).
            </li>
            <li>
              Dejá <strong>Active</strong> marcado y tocá <strong>Add webhook</strong>.
            </li>
          </ol>

          {canManageOrganization && webhookSecret ? (
            <div className="mt-5 space-y-4">
              <CopyField
                label="1. Payload URL"
                value={payloadUrl}
                hint="Copiá esto en el campo Payload URL de GitHub."
              />
              <CopyField
                label="2. Secret"
                value={webhookSecret}
                hint="Este es el secreto de tu organización. Pegalo en el campo Secret de GitHub."
              />
              <form action={rotateWebhookKeyAction}>
                <button
                  type="submit"
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Rotar secret (después actualizalo también en GitHub)
                </button>
              </form>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Solo OWNER o ADMIN pueden ver y copiar el secret del webhook.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
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

          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
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
                {isOwner ? <option value="ADMIN">ADMIN</option> : null}
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
                    {canManageOrganization ? (
                      <p className="mt-1 break-all font-mono text-[11px] text-zinc-400">
                        {appUrl}/invite/{invitation.token}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-zinc-400">
                        Enlace oculto. Solo OWNER/ADMIN pueden verlo.
                      </p>
                    )}
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
