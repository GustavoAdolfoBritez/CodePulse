import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export async function generateUniqueOrganizationSlug(input: string): Promise<string> {
  const base = slugify(input) || "organization";
  let attempt = base;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug: attempt } })) {
    counter += 1;
    attempt = `${base}-${counter}`;
  }

  return attempt;
}

export function generateWebhookApiKey() {
  return `cp_wh_${crypto.randomBytes(18).toString("hex")}`;
}

export async function ensureUserHasOrganization(args: {
  userId: string;
  name?: string | null;
  email?: string | null;
  role?: Role;
}) {
  const role = args.role ?? "OWNER";

  const existingMembership = await prisma.organizationMembership.findFirst({
    where: { userId: args.userId },
    include: { organization: true },
    orderBy: { createdAt: "asc" },
  });

  if (existingMembership) {
    await prisma.user.update({
      where: { id: args.userId },
      data: {
        currentOrganizationId: existingMembership.organizationId,
        organizationId: existingMembership.organizationId,
      },
    });

    return existingMembership.organization;
  }

  const orgName = args.name?.trim() || args.email?.split("@")[0] || "My Organization";
  const slug = await generateUniqueOrganizationSlug(orgName);

  const organization = await prisma.organization.create({
    data: {
      name: orgName,
      slug,
      webhookApiKey: generateWebhookApiKey(),
      memberships: {
        create: {
          userId: args.userId,
          role,
        },
      },
    },
  });

  await prisma.user.update({
    where: { id: args.userId },
    data: {
      organizationId: organization.id,
      currentOrganizationId: organization.id,
      role,
    },
  });

  return organization;
}
