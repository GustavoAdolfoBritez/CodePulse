"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { acceptOrganizationInvitation } from "@/lib/invitations";
import { passwordSchema } from "@/lib/password-policy";
import { consumeRateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

const registerSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre."),
  email: z.string().email("Ingresa un email válido."),
  password: passwordSchema,
});

function fail(path: "/login" | "/register", message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function rateLimitOrFail(key: string, path: "/login" | "/register") {
  const result = consumeRateLimit({ key, limit: 10, windowMs: 15 * 60 * 1000 });
  if (!result.ok) {
    fail(path, `Demasiados intentos. Espera ${result.retryAfterSec}s e inténtalo de nuevo.`);
  }
}

async function signInWithCredentials(args: {
  email: string;
  password: string;
  redirectTo: string;
  errorPath: "/login" | "/register";
}) {
  try {
    const result = await signIn("credentials", {
      email: args.email,
      password: args.password,
      redirect: false,
    });

    if (!result || result.error) {
      fail(args.errorPath, "Credenciales inválidas.");
    }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    if (error instanceof AuthError) {
      fail(args.errorPath, "Credenciales inválidas.");
    }
    console.error("[auth] credentials sign-in failed", error);
    fail(
      args.errorPath,
      "No se pudo iniciar sesión. Revisa AUTH_SECRET / AUTH_URL en Vercel."
    );
  }

  redirect(args.redirectTo);
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    fail("/login", parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  rateLimitOrFail(`login:${parsed.data.email.toLowerCase()}`, "/login");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: {
      currentOrganizationId: true,
      memberships: { select: { organizationId: true }, take: 1 },
    },
  });

  const organizationId =
    user?.currentOrganizationId ?? user?.memberships[0]?.organizationId ?? null;
  const callbackUrl = formData.get("callbackUrl")?.toString();
  const redirectTo = resolveAuthRedirect(callbackUrl, organizationId);

  await signInWithCredentials({
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo,
    errorPath: "/login",
  });
}

export async function loginWithGitHubAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl")?.toString();
  const redirectTo = getSafeRedirectPath(callbackUrl, "/onboarding");
  await signIn("github", { redirectTo });
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    fail("/register", parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  rateLimitOrFail(`register:${parsed.data.email.toLowerCase()}`, "/register");

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    fail("/register", "Ya existe una cuenta con ese email.");
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  await signInWithCredentials({
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/onboarding",
    errorPath: "/login",
  });
}

export async function registerWithInviteAction(formData: FormData) {
  const parsed = registerSchema
    .extend({
      token: z.string().min(1),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      token: formData.get("token"),
    });

  if (!parsed.success) {
    fail("/register", parsed.error.issues[0]?.message ?? "Datos inválidos.");
  }

  rateLimitOrFail(`register-invite:${parsed.data.email.toLowerCase()}`, "/register");

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    fail(
      "/login",
      "Ya existe una cuenta con ese email. Inicia sesión para aceptar la invitación."
    );
  }

  const passwordHash = await hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  try {
    await acceptOrganizationInvitation({
      token: parsed.data.token,
      userId: user.id,
      userEmail: user.email,
    });
  } catch (error) {
    await prisma.user.delete({ where: { id: user.id } });
    fail(
      "/register",
      error instanceof Error ? error.message : "No se pudo aceptar la invitación."
    );
  }

  await signInWithCredentials({
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: "/dashboard",
    errorPath: "/login",
  });
}
