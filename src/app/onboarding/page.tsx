import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionAction } from "./actions";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  // Never auto-redirect to /login here. A cookie mismatch between Edge getToken
  // and Node auth() used to create ERR_TOO_MANY_REDIRECTS with the proxy.
  if (!session?.user?.id) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 16px",
          backgroundColor: "#09090b",
          color: "#f4f4f5",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 440,
            borderRadius: 24,
            border: "1px solid #27272a",
            backgroundColor: "#18181b",
            padding: 32,
            textAlign: "center",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: "#fafafa" }}>
            Sesión no válida
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: 14, color: "#a1a1aa", lineHeight: 1.5 }}>
            No pudimos leer tu sesión. Borra la cookie del sitio o vuelve a iniciar sesión.
          </p>
          <div style={{ marginTop: 24, display: "grid", gap: 12 }}>
            <form action={clearSessionAction}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: "#4f46e5",
                  color: "#fff",
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cerrar sesión y entrar de nuevo
              </button>
            </form>
            <Link
              href="/register"
              style={{
                display: "block",
                borderRadius: 12,
                border: "1px solid #3f3f46",
                padding: "12px 16px",
                fontSize: 14,
                color: "#e4e4e7",
                textDecoration: "none",
              }}
            >
              Crear cuenta con email
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const membershipCount = await prisma.organizationMembership.count({
    where: { userId: session.user.id },
  });

  if (membershipCount > 0) {
    redirect("/dashboard");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
        backgroundColor: "#09090b",
      }}
    >
      <OnboardingWizard />
    </main>
  );
}
