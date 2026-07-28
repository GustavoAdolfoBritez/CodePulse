import type { CSSProperties } from "react";
import { auth } from "@/auth";
import { loginWithGitHubAction, registerAction } from "@/app/(auth)/actions";
import { AuthShell } from "@/components/auth/AuthShell";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";

interface RegisterPageProps {
  searchParams: Promise<{ error?: string }>;
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

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(getPostAuthRedirectPath(session.user.organizationId));
  }

  const authError = params.error ? decodeURIComponent(params.error) : null;

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate con GitHub o email. Luego configurarás tu espacio de trabajo."
      alternateHref="/login"
      alternateLabel="¿Ya tienes cuenta? Iniciar sesión"
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
            Registrarme con GitHub
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: 12, color: "#71717a", margin: 0 }}>
          o crear cuenta local
        </p>

        <form action={registerAction} style={{ display: "grid", gap: 12 }}>
          <div>
            <label htmlFor="name" style={{ display: "block", marginBottom: 6, fontSize: 12, color: "#a1a1aa" }}>
              Nombre
            </label>
            <input id="name" name="name" type="text" required style={fieldStyle} />
          </div>
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
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              style={fieldStyle}
            />
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
            Crear cuenta
          </button>
        </form>

        <p style={{ margin: 0, fontSize: 12, color: "#71717a" }}>
          Usa al menos 8 caracteres con letras y números.
        </p>
      </div>
    </AuthShell>
  );
}
