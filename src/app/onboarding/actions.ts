"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  generateUniqueOrganizationSlug,
  generateWebhookApiKey,
} from "@/lib/organizations";
import type { OnboardingState } from "./onboarding-state";

const onboardingSchema = z.object({
  organizationName: z.string().min(2, "Ingresa un nombre de al menos 2 caracteres."),
  plan: z.enum(["starter", "pro", "enterprise"]),
  initialSource: z.enum(["github", "api", "both"]),
});

export async function completeOnboardingAction(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const parsed = onboardingSchema.safeParse({
    organizationName: formData.get("organizationName"),
    plan: formData.get("plan"),
    initialSource: formData.get("initialSource"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const existingMembership = await prisma.organizationMembership.findFirst({
    where: { userId: session.user.id },
  });

  if (existingMembership) {
    redirect("/dashboard");
  }

  const slug = await generateUniqueOrganizationSlug(parsed.data.organizationName);

  const organization = await prisma.organization.create({
    data: {
      name: parsed.data.organizationName.trim(),
      slug,
      webhookApiKey: generateWebhookApiKey(),
      memberships: {
        create: {
          userId: session.user.id,
          role: "OWNER",
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      organizationId: organization.id,
      currentOrganizationId: organization.id,
      role: "OWNER",
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");

  if (parsed.data.initialSource === "github") {
    redirect("/dashboard/projects?welcome=github");
  }

  if (parsed.data.initialSource === "api") {
    redirect("/dashboard/projects?welcome=api");
  }

  redirect("/dashboard");
}

export async function clearSessionAction() {
  const { signOut } = await import("@/auth");
  await signOut({ redirectTo: "/login" });
}
