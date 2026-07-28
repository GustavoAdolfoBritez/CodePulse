import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const session = await auth();
  if (session?.user) {
    redirect(params.callbackUrl ?? getPostAuthRedirectPath(session.user.organizationId));
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu organización para monitorear repositorios, APIs y alertas."
      alternateHref="/register"
      alternateLabel="¿No tienes cuenta? Crear una cuenta"
    >
      <LoginForm callbackUrl={params.callbackUrl} />
    </AuthShell>
  );
}
