"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { enqueueAnalysisJob } from "@/server/queue/queues";
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

  await Promise.all(
    projects.map((project) =>
      enqueueAnalysisJob({
        projectId: project.id,
        sourceType: project.sourceType,
        target: project.githubRepoUrl ?? project.apiUrl ?? "",
        triggeredBy: "global-audit",
      })
    )
  );

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/insights");

  return {
    success: true,
    error: null,
    message: `Se encolaron ${projects.length} auditorías en paralelo.`,
  };
}
