import { auth } from "@/auth";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect(getPostAuthRedirectPath(session.user.organizationId));
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Regístrate con GitHub o credenciales locales. Luego configurarás tu espacio de trabajo."
      alternateHref="/login"
      alternateLabel="¿Ya tienes cuenta? Iniciar sesión"
    >
      <RegisterForm />
    </AuthShell>
  );
}
