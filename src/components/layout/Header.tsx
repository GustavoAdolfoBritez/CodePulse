import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export async function Header({ eyebrow, title, subtitle, actions }: HeaderProps) {
  const organization = await getCurrentOrganization();
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({
      where: { organizationId: organization.id, read: false },
    }),
  ]);

  return (
    <header className="flex min-h-16 shrink-0 flex-col gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
      </div>
    </header>
  );
}
