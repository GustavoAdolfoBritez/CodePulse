import type { ReactNode } from "react";
import Link from "next/link";
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
    <main
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundColor: "#09090b" }}
    >
      <div
        className="w-full max-w-md rounded-3xl border p-8 shadow-sm"
        style={{
          backgroundColor: "#18181b",
          borderColor: "#27272a",
          color: "#f4f4f5",
        }}
      >
        <div className="mb-6 flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
            style={{ backgroundColor: "#fafafa", color: "#09090b" }}
          >
            CP
          </span>
          <div>
            <p className="text-base font-semibold" style={{ color: "#fafafa" }}>
              {siteConfig.name}
            </p>
            <p className="text-xs" style={{ color: "#a1a1aa" }}>
              {siteConfig.description}
            </p>
          </div>
        </div>

        <h1 className="text-2xl font-semibold" style={{ color: "#fafafa" }}>
          {title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: "#a1a1aa" }}>
          {subtitle}
        </p>

        <div className="mt-6">{children}</div>

        <p className="mt-6 text-sm" style={{ color: "#a1a1aa" }}>
          <Link href={alternateHref} className="font-medium hover:underline" style={{ color: "#818cf8" }}>
            {alternateLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
