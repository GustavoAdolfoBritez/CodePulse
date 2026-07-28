import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { loginAction, loginWithGitHubAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

const fieldStyle: CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 12,
  border: "1px solid #3f3f46",
  backgroundColor: "#09090b",
  color: "#fafafa",
  padding: "12px 14px",
  fontSize: 14,
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await auth();
  const safeCallback = params.callbackUrl
    ? getSafeRedirectPath(params.callbackUrl, "")
    : "";

  // Prefer an explicit safe callback (e.g. /dashboard/...). Avoid bouncing
  // authenticated users through /onboarding when the proxy used to mis-read
  // the HTTPS session cookie (that combo caused ERR_TOO_MANY_REDIRECTS).
  if (session?.user) {
    if (safeCallback && safeCallback !== "/onboarding" && safeCallback !== "/login") {
      redirect(safeCallback);
    }
    redirect(getPostAuthRedirectPath(session.user.organizationId));
  }

  const authError =
    params.error === "Configuration"
      ? "Auth no está bien configurado en el servidor. Revisa AUTH_SECRET, AUTH_URL y GitHub OAuth en Vercel."
      : params.error === "AccessDenied"
        ? "Acceso denegado."
        : params.error === "OAuthAccountNotLinked"
          ? "Ese email ya existe con otro método de login."
          : params.error
            ? decodeURIComponent(params.error)
            : null;

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu organización para monitorear repositorios, APIs y alertas."
      alternateHref="/register"
      alternateLabel="¿No tienes cuenta? Crear una cuenta"
    >
      {authError ? (
        <p
          style={{
            margin: "0 0 16px",
            borderRadius: 8,
            backgroundColor: "#450a0a",
            color: "#fecaca",
            padding: "10px 12px",
            fontSize: 13,
          }}
        >
          {authError}
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 16 }}>
        <form action={loginWithGitHubAction}>
          {safeCallback ? <input type="hidden" name="callbackUrl" value={safeCallback} /> : null}
          <button
            type="submit"
            style={{
              width: "100%",
              borderRadius: 12,
              border: "1px solid #3f3f46",
              backgroundColor: "#09090b",
              color: "#e4e4e7",
              padding: "12px 16px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Iniciar sesión con GitHub
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#71717a", margin: 0 }}>
          o usar credenciales
        </p>

        <form action={loginAction} style={{ display: "grid", gap: 12 }}>
          {safeCallback ? <input type="hidden" name="callbackUrl" value={safeCallback} /> : null}
          <div>
            <label htmlFor="email" style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#a1a1aa" }}>
              Email
            </label>
            <input id="email" name="email" type="email" required style={fieldStyle} />
          </div>
          <div>
            <label
              htmlFor="password"
              style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#a1a1aa" }}
            >
              Contraseña
            </label>
            <input id="password" name="password" type="password" required style={fieldStyle} />
          </div>
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
            Entrar
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
