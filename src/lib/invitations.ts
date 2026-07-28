import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const INVITATION_TTL_DAYS = 7;

export function generateInvitationToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function getInvitationExpiryDate() {
  return new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export async function acceptOrganizationInvitation(args: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const invitation = await prisma.organizationInvitation.findUnique({
    where: { token: args.token },
    include: { organization: true },
  });

  if (!invitation) {
    throw new Error("Invitación no encontrada.");
  }

  if (invitation.expiresAt < new Date()) {
    await prisma.organizationInvitation.delete({ where: { id: invitation.id } });
    throw new Error("Esta invitación ha expirado.");
  }

  if (invitation.email.toLowerCase() !== args.userEmail.toLowerCase()) {
    throw new Error("Esta invitación fue enviada a otro email.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: args.userId,
          organizationId: invitation.organizationId,
        },
      },
      update: { role: invitation.role },
      create: {
        userId: args.userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    await tx.user.update({
      where: { id: args.userId },
      data: {
        organizationId: invitation.organizationId,
        currentOrganizationId: invitation.organizationId,
        role: invitation.role,
      },
    });

    await tx.organizationInvitation.delete({ where: { id: invitation.id } });
  });

  return invitation.organization;
}

export async function createOrganizationInvitation(args: {
  organizationId: string;
  email: string;
  role: Extract<Role, "ADMIN" | "MEMBER">;
}) {
  const normalizedEmail = args.email.trim().toLowerCase();

  const existingMember = await prisma.organizationMembership.findFirst({
    where: {
      organizationId: args.organizationId,
      user: { email: normalizedEmail },
    },
  });

  if (existingMember) {
    throw new Error("Ese email ya pertenece a la organización.");
  }

  return prisma.organizationInvitation.upsert({
    where: {
      organizationId_email: {
        organizationId: args.organizationId,
        email: normalizedEmail,
      },
    },
    update: {
      role: args.role,
      token: generateInvitationToken(),
      expiresAt: getInvitationExpiryDate(),
    },
    create: {
      organizationId: args.organizationId,
      email: normalizedEmail,
      role: args.role,
      token: generateInvitationToken(),
      expiresAt: getInvitationExpiryDate(),
    },
  });
}
