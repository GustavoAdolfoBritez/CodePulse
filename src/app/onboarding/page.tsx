import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OnboardingWizard } from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await auth();

  // Do NOT hard-redirect to /login automatically when session is missing.
  // A stale JWT cookie can make the proxy think the user is authenticated while
  // `auth()` returns null — auto-redirects recreate ERR_TOO_MANY_REDIRECTS.
  if (!session?.user?.id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
        <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Sesión no válida
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No pudimos leer tu sesión. Cierra las cookies del sitio o vuelve a iniciar sesión.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Ir a iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <OnboardingWizard />
    </main>
  );
}
