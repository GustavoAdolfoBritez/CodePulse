import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function PATCH(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  const context = await getCurrentOrganizationContext({ redirectToLogin: false });
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notification = await prisma.notification.findFirst({
    where: { id, organizationId: context.organization.id },
  });

  if (!notification) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
