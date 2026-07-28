import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";
import { enqueueAnalysisJob } from "@/server/queue/queues";

const createProjectSchema = z.object({
  name: z.string().min(1),
  sourceType: z.enum(["GITHUB_REPO", "API_ENDPOINT"]),
  githubRepoUrl: z.string().url().optional(),
  apiUrl: z.string().url().optional(),
});

export async function GET() {
  const context = await getCurrentOrganizationContext({ redirectToLogin: false });
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
    where: { organizationId: context.organization.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ projects });
}

export async function POST(request: Request) {
  const context = await getCurrentOrganizationContext({ redirectToLogin: false });
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      organizationId: context.organization.id,
    },
  });

  // Kick off the first analysis in the background as soon as a project is
  // connected — this is what enqueues the Job onto `analyze-repo-queue`.
  const target = project.githubRepoUrl ?? project.apiUrl ?? "";
  if (target) {
    await enqueueAnalysisJob({
      projectId: project.id,
      sourceType: project.sourceType,
      target,
    });
  }

  return NextResponse.json({ project }, { status: 201 });
}
