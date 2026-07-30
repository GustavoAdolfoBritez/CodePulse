import type { ReactNode } from "react";

interface HeaderProps {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function Header({ eyebrow, title, subtitle, actions }: HeaderProps) {
  return (
    <header className="flex min-h-14 shrink-0 flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 sm:min-h-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="truncate text-lg font-semibold text-zinc-900 sm:text-xl dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 line-clamp-2 break-all text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
