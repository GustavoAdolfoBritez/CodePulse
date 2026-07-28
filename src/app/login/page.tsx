import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
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

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu organización para monitorear repositorios, APIs y alertas."
      alternateHref="/register"
      alternateLabel="¿No tienes cuenta? Crear una cuenta"
    >
      <LoginForm callbackUrl={safeCallback || undefined} />
    </AuthShell>
  );
}
