"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { siteConfig, type NavItem } from "@/config/site";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-100"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active
            ? "text-zinc-900 dark:text-white"
            : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
        )}
      />
      {item.label}
    </Link>
  );
}

function SidebarBody({
  pathname,
  organizationName,
  userName,
  onNavigate,
}: {
  pathname: string;
  organizationName: string;
  userName?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <Zap className="h-4 w-4" fill="currentColor" />
        </span>
        <span className="text-base font-semibold text-zinc-900 dark:text-white">
          {siteConfig.name}
        </span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
        {siteConfig.navSections.map((section) => (
          <div key={section.label} className="space-y-1.5">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}

        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
            Support
          </p>
          <div className="space-y-1">
            {siteConfig.supportItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900">
            {(userName?.[0] ?? organizationName[0] ?? "U").toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-white">
              {organizationName}
            </p>
            <p className="truncate text-xs text-zinc-400 dark:text-zinc-500">
              {userName ?? "CodePulse user"}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </>
  );
}

interface SidebarProps {
  organizationName?: string;
  userName?: string | null;
}

export function Sidebar({ organizationName = "Organization", userName }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setOpen(true)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 dark:border-zinc-800 dark:text-zinc-300"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
            <Zap className="h-3.5 w-3.5" fill="currentColor" />
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            {siteConfig.name}
          </span>
        </div>
        <span className="w-9" aria-hidden />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <SidebarBody
          pathname={pathname}
          organizationName={organizationName}
          userName={userName}
        />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-zinc-950/50"
            onClick={() => setOpen(false)}
          />
          <aside className="relative flex h-full w-[min(100%,20rem)] flex-col border-r border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              aria-label="Cerrar"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarBody
              pathname={pathname}
              organizationName={organizationName}
              userName={userName}
              onNavigate={() => setOpen(false)}
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}
