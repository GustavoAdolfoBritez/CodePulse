import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganizationContext } from "@/lib/current-org";
import { enqueueOrRunAnalysis } from "@/server/analysis/enqueue-or-run";
import { assertSafeGithubRepoUrl, assertSafeOutboundUrl } from "@/lib/url-safety";

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

  try {
    if (parsed.data.sourceType === "GITHUB_REPO" && parsed.data.githubRepoUrl) {
      parsed.data.githubRepoUrl = assertSafeGithubRepoUrl(parsed.data.githubRepoUrl);
    }
    if (parsed.data.sourceType === "API_ENDPOINT" && parsed.data.apiUrl) {
      parsed.data.apiUrl = assertSafeOutboundUrl(parsed.data.apiUrl);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "URL no permitida." },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      ...parsed.data,
      organizationId: context.organization.id,
    },
  });

  const target = project.githubRepoUrl ?? project.apiUrl ?? "";
  if (target) {
    try {
      await enqueueOrRunAnalysis({
        projectId: project.id,
        sourceType: project.sourceType,
        target,
      });
    } catch (error) {
      console.error("[api/projects] analysis failed", error);
    }
  }

  return NextResponse.json({ project }, { status: 201 });
}
