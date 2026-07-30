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
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        backgroundColor: "#09090b",
        color: "#f4f4f5",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          borderRadius: 24,
          border: "1px solid #27272a",
          backgroundColor: "#18181b",
          padding: "24px 20px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            color: "#fafafa",
          }}
        >
          {siteConfig.name}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>
          {siteConfig.description}
        </p>

        <h1
          style={{
            margin: "28px 0 0",
            fontSize: 24,
            fontWeight: 600,
            color: "#fafafa",
          }}
        >
          {title}
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: 14, color: "#a1a1aa", lineHeight: 1.5 }}>
          {subtitle}
        </p>

        <div style={{ marginTop: 24 }}>{children}</div>

        <p style={{ margin: "24px 0 0", fontSize: 14, color: "#a1a1aa" }}>
          <Link href={alternateHref} style={{ color: "#818cf8", fontWeight: 500 }}>
            {alternateLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}
