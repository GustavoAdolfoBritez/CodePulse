import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";
import { enqueueOrRunAnalysis } from "@/server/analysis/enqueue-or-run";

const triggerAnalysisSchema = z.object({
  projectId: z.string().min(1),
});

/**
 * Enqueues an async analysis Job (BullMQ) for a Project instead of doing
 * heavy repo/API work inline in the request handler.
 */
export async function POST(request: Request) {
  const context = await getCurrentOrganizationContext({ redirectToLogin: false });
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = triggerAnalysisSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: { id: parsed.data.projectId, organizationId: context.organization.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const target = project.githubRepoUrl ?? project.apiUrl ?? "";

  try {
    const result = await enqueueOrRunAnalysis({
      projectId: project.id,
      sourceType: project.sourceType,
      target,
    });
    return NextResponse.json(
      { jobId: result.jobId, status: result.mode === "queued" ? "queued" : "completed" },
      { status: 202 }
    );
  } catch (error) {
    console.error("[api/analysis] analysis failed", error);
    return NextResponse.json(
      { error: "No se pudo completar el análisis." },
      { status: 503 }
    );
  }
}
