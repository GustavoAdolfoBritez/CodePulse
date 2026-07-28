"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { enqueueOrRunAnalysis } from "@/server/analysis/enqueue-or-run";
import type { BatchAuditState } from "./batch-audit-state";

export async function runGlobalAuditAction(prevState: BatchAuditState): Promise<BatchAuditState> {
  void prevState;
  const organization = await getCurrentOrganization();
  const projects = await prisma.project.findMany({
    where: { organizationId: organization.id },
  });

  if (projects.length === 0) {
    return {
      success: false,
      error: "No hay proyectos conectados para auditar.",
      message: null,
    };
  }

  try {
    await Promise.all(
      projects.map((project) =>
        enqueueOrRunAnalysis({
          projectId: project.id,
          sourceType: project.sourceType,
          target: project.githubRepoUrl ?? project.apiUrl ?? "",
          triggeredBy: "global-audit",
        })
      )
    );
  } catch (error) {
    console.error("[runGlobalAuditAction] analysis failed", error);
    return {
      success: false,
      error: "No se pudo completar la auditoría global. Reintenta en unos segundos.",
      message: null,
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/insights");

  return {
    success: true,
    error: null,
    message: `Se encolaron ${projects.length} auditorías en paralelo.`,
  };
}
