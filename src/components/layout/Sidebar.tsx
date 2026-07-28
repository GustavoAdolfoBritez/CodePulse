"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Zap } from "lucide-react";
import { siteConfig, type NavItem } from "@/config/site";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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

interface SidebarProps {
  organizationName?: string;
  userName?: string | null;
}

export function Sidebar({ organizationName = "Organization", userName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <Zap className="h-4 w-4" fill="currentColor" />
        </span>
        <span className="text-base font-semibold text-zinc-900 dark:text-white">
          {siteConfig.name}
        </span>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1">Search anything</span>
          <kbd className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500">
            ⌘K
          </kbd>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
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
                  active={pathname === item.href}
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
                active={pathname === item.href}
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
    </aside>
  );
}
