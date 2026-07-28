"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { resolveAuthRedirect } from "@/lib/auth-redirect";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { acceptOrganizationInvitation } from "@/lib/invitations";
import { passwordSchema } from "@/lib/password-policy";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { AuthFormState } from "./auth-state";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

const registerSchema = z.object({
  name: z.string().min(2, "Ingresa tu nombre."),
  email: z.string().email("Ingresa un email válido."),
  password: passwordSchema,
});

function rateLimitOrError(key: string): AuthFormState | null {
  const result = consumeRateLimit({ key, limit: 10, windowMs: 15 * 60 * 1000 });
  if (!result.ok) {
    return {
      error: `Demasiados intentos. Espera ${result.retryAfterSec}s e inténtalo de nuevo.`,
    };
  }
  return null;
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const limited = rateLimitOrError(`login:${parsed.data.email.toLowerCase()}`);
  if (limited) {
    return limited;
  }

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

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Credenciales inválidas." };
    }
    throw error;
  }

  return { error: null };
}

export async function loginWithGitHubAction(formData: FormData) {
  const callbackUrl = formData.get("callbackUrl")?.toString();
  const redirectTo = getSafeRedirectPath(callbackUrl, "/dashboard");
  await signIn("github", { redirectTo });
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const limited = rateLimitOrError(`register:${parsed.data.email.toLowerCase()}`);
  if (limited) {
    return limited;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/onboarding",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "La cuenta se creó, pero el login automático falló." };
    }
    throw error;
  }

  return { error: null };
}

export async function registerWithInviteAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
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
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const limited = rateLimitOrError(`register-invite:${parsed.data.email.toLowerCase()}`);
  if (limited) {
    return limited;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return { error: "Ya existe una cuenta con ese email. Inicia sesión para aceptar la invitación." };
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
    return {
      error: error instanceof Error ? error.message : "No se pudo aceptar la invitación.",
    };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "La cuenta se creó, pero el login automático falló." };
    }
    throw error;
  }

  return { error: null };
}
