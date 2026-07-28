"use server";

import { AuthError } from "next-auth";
import { hash } from "bcryptjs";
import { z } from "zod";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";
import { acceptOrganizationInvitation } from "@/lib/invitations";
import type { AuthFormState } from "./auth-state";

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Ingresa tu nombre."),
});

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
  const redirectTo = callbackUrl || getPostAuthRedirectPath(organizationId);

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
  await signIn("github", { redirectTo: callbackUrl || "/dashboard" });
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

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return { error: "Ya existe una cuenta con ese email." };
  }

  const passwordHash = await hash(parsed.data.password, 10);

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

  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existingUser) {
    return { error: "Ya existe una cuenta con ese email. Inicia sesión para aceptar la invitación." };
  }

  const passwordHash = await hash(parsed.data.password, 10);

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
