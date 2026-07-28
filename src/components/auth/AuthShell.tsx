import type { ReactNode } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { siteConfig } from "@/config/site";

interface AuthShellProps {
  title: string;
  subtitle: string;
  alternateHref: string;
  alternateLabel: string;
  children: ReactNode;
}

export function AuthShell({
  title,
  subtitle,
  alternateHref,
  alternateLabel,
  children,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Zap className="h-5 w-5" fill="currentColor" />
          </span>
          <div>
            <p className="text-base font-semibold text-zinc-900 dark:text-white">{siteConfig.name}</p>
            <p className="text-xs text-zinc-400">{siteConfig.description}</p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>

        <div className="mt-6">{children}</div>

        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          <Link href={alternateHref} className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            {alternateLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
