import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await auth();
  const safeCallback = params.callbackUrl
    ? getSafeRedirectPath(params.callbackUrl, "")
    : "";

  if (session?.user) {
    redirect(
      safeCallback || getPostAuthRedirectPath(session.user.organizationId)
    );
  }

  const authError =
    params.error === "Configuration"
      ? "Auth no está bien configurado en el servidor. Revisa AUTH_SECRET, AUTH_URL y las credenciales de GitHub en Vercel."
      : params.error === "AccessDenied"
        ? "Acceso denegado."
        : params.error === "OAuthAccountNotLinked"
          ? "Ese email ya existe con otro método de login. Entra con email/contraseña o vincula la cuenta."
          : params.error
            ? "No se pudo iniciar sesión. Inténtalo de nuevo."
            : null;

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu organización para monitorear repositorios, APIs y alertas."
      alternateHref="/register"
      alternateLabel="¿No tienes cuenta? Crear una cuenta"
    >
      {authError ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600 dark:bg-rose-950 dark:text-rose-300">
          {authError}
        </p>
      ) : null}
      <LoginForm callbackUrl={safeCallback || undefined} />
    </AuthShell>
  );
}
