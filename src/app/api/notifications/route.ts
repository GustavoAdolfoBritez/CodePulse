import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { action?: string } | null;
  const context = await getCurrentOrganizationContext({ redirectToLogin: false });
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (body?.action === "mark-all-read") {
    await prisma.notification.updateMany({
      where: { organizationId: context.organization.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}

export async function DELETE() {
  const context = await getCurrentOrganizationContext({ redirectToLogin: false });
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.deleteMany({
    where: { organizationId: context.organization.id, read: true },
  });

  return NextResponse.json({ ok: true });
}
