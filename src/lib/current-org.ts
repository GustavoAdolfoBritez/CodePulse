import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

interface AuthScopeOptions {
  redirectToLogin?: boolean;
}

export interface OrganizationContext {
  session: Session;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    currentOrganizationId: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    webhookApiKey: string | null;
  };
  memberships: Array<{
    organizationId: string;
    role: string;
    organization: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  activeRole: string;
}

export async function getCurrentOrganizationContext(
  options: AuthScopeOptions = {}
): Promise<OrganizationContext | null> {
  const session = await auth();
  if (!session?.user?.id) {
    if (options.redirectToLogin !== false) {
      redirect("/login");
    }
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      currentOrganizationId: true,
      memberships: {
        include: {
          organization: {
            select: { id: true, name: true, slug: true, webhookApiKey: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!user || user.memberships.length === 0) {
    redirect("/onboarding");
  }

  const activeMembership =
    user.memberships.find((membership) => membership.organizationId === user.currentOrganizationId) ??
    user.memberships[0];

  if (!user.currentOrganizationId || user.currentOrganizationId !== activeMembership.organizationId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { currentOrganizationId: activeMembership.organizationId },
    });
  }

  return {
    session,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      currentOrganizationId: activeMembership.organizationId,
    },
    organization: activeMembership.organization,
    memberships: user.memberships.map((membership) => ({
      organizationId: membership.organizationId,
      role: membership.role,
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
    })),
    activeRole: activeMembership.role,
  };
}

export async function getCurrentOrganization() {
  const context = await getCurrentOrganizationContext();
  if (!context) {
    throw new Error("Unauthorized");
  }
  return context.organization;
}
