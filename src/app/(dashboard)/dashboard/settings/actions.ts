"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";
import { generateWebhookApiKey } from "@/lib/organizations";
import {
  acceptOrganizationInvitation,
  createOrganizationInvitation,
} from "@/lib/invitations";

function assertCanManageOrganization(role: string) {
  if (!(role === "OWNER" || role === "ADMIN")) {
    throw new Error("Forbidden");
  }
}

export async function updateProfileAction(formData: FormData) {
  const context = await getCurrentOrganizationContext();
  const name = z.string().min(2).parse(formData.get("name"));

  await prisma.user.update({
    where: { id: context!.user.id },
    data: { name },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  redirect("/dashboard/settings");
}

export async function updateOrganizationAction(formData: FormData) {
  const context = await getCurrentOrganizationContext();
  assertCanManageOrganization(context!.activeRole);
  const organizationName = z.string().min(2).parse(formData.get("organizationName"));

  // Webhook key is rotate-only — never accept free-form values from the form.
  await prisma.organization.update({
    where: { id: context!.organization.id },
    data: {
      name: organizationName,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/insights");
  redirect("/dashboard/settings");
}

export async function rotateWebhookKeyAction() {
  const context = await getCurrentOrganizationContext();
  assertCanManageOrganization(context!.activeRole);

  await prisma.organization.update({
    where: { id: context!.organization.id },
    data: { webhookApiKey: generateWebhookApiKey() },
  });

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings");
}

export async function switchOrganizationAction(formData: FormData) {
  const context = await getCurrentOrganizationContext();
  const organizationId = z.string().min(1).parse(formData.get("organizationId"));

  const membership = context!.memberships.find((item) => item.organizationId === organizationId);
  if (!membership) {
    redirect("/dashboard/settings");
  }

  await prisma.user.update({
    where: { id: context!.user.id },
    data: { currentOrganizationId: organizationId },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings");
}

export async function sendInvitationAction(formData: FormData) {
  const context = await getCurrentOrganizationContext();
  assertCanManageOrganization(context!.activeRole);

  const parsed = z
    .object({
      email: z.string().email(),
      role: z.enum(["ADMIN", "MEMBER"]),
    })
    .parse({
      email: formData.get("email"),
      role: formData.get("role"),
    });

  // Only OWNER can invite ADMIN — prevents lateral privilege escalation.
  if (parsed.role === "ADMIN" && context!.activeRole !== "OWNER") {
    redirect(
      `/dashboard/settings?inviteError=${encodeURIComponent(
        "Solo el OWNER puede invitar administradores."
      )}`
    );
  }

  try {
    await createOrganizationInvitation({
      organizationId: context!.organization.id,
      email: parsed.email,
      role: parsed.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar la invitación.";
    redirect(`/dashboard/settings?inviteError=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings");
}

export async function revokeInvitationAction(formData: FormData) {
  const context = await getCurrentOrganizationContext();
  assertCanManageOrganization(context!.activeRole);
  const invitationId = z.string().min(1).parse(formData.get("invitationId"));

  await prisma.organizationInvitation.deleteMany({
    where: {
      id: invitationId,
      organizationId: context!.organization.id,
    },
  });

  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings");
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function acceptInviteAction(formData: FormData) {
  const token = z.string().min(1).parse(formData.get("token"));
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  await acceptOrganizationInvitation({
    token,
    userId: session.user.id,
    userEmail: session.user.email,
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function loginWithInviteAction(formData: FormData) {
  const token = z.string().min(1).parse(formData.get("token"));
  // Token is already opaque path segment; keep redirect same-origin relative.
  await signIn("github", { redirectTo: `/invite/${encodeURIComponent(token)}` });
}
