import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getUserGithubAccessToken } from "@/lib/github-oauth";
import { generateRepoInsight } from "@/server/ai/client";
import { buildApiAnalysisContext, buildRepoAnalysisContext } from "@/server/ai/prompts";
import { fetchRepoSnapshot, parseRepoUrl, type RepoSnapshot } from "@/lib/github";
import { assertSafeOutboundUrl } from "@/lib/url-safety";
import type { AnalysisJobData } from "@/server/queue/queues";

const API_PROBE_TIMEOUT_MS = 8_000;

async function maybeCreateRiskNotification(args: {
  projectId: string;
  severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  score: number;
  summary: string;
}) {
  if (!(args.severity === "HIGH" || args.severity === "CRITICAL" || args.score < 60)) {
    return;
  }

  const project = await prisma.project.findUnique({
    where: { id: args.projectId },
    select: { id: true, name: true, organizationId: true },
  });

  if (!project) {
    return;
  }

  await prisma.notification.create({
    data: {
      organizationId: project.organizationId,
      title:
        args.severity === "CRITICAL" || args.score < 45
          ? `Alerta crítica en ${project.name}`
          : `Riesgo elevado detectado en ${project.name}`,
      message: `${args.summary} (AI Score: ${args.score}/100, severity: ${args.severity}).`,
      type: args.severity === "CRITICAL" || args.score < 45 ? "CRITICAL" : "WARNING",
    },
  });
}

async function buildGithubContext(
  target: string,
  token?: string | null
): Promise<{ context: string; snapshot: RepoSnapshot }> {
  const { owner, repo } = parseRepoUrl(target);
  const snapshot = await fetchRepoSnapshot(owner, repo, token ?? undefined);
  return { context: buildRepoAnalysisContext(snapshot), snapshot };
}

async function buildApiContext(target: string) {
  const safeTarget = assertSafeOutboundUrl(target);
  const startedAt = Date.now();
  let httpStatus: number | null = null;
  let errorMessage: string | null = null;
  let reachable = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_PROBE_TIMEOUT_MS);
    const response = await fetch(safeTarget, {
      method: "GET",
      signal: controller.signal,
      redirect: "error",
      headers: {
        "User-Agent": "CodePulse-AnalysisWorker/1.0",
      },
    });
    clearTimeout(timeout);
    httpStatus = response.status;
    reachable = true;
  } catch (error) {
    errorMessage = (error as Error).message;
  }

  const latencyMs = Date.now() - startedAt;

  return {
    context: buildApiAnalysisContext({
      apiUrl: safeTarget,
      reachable,
      httpStatus,
      latencyMs,
      errorMessage,
    }),
    reachable,
    httpStatus,
    latencyMs,
    errorMessage,
  };
}

/**
 * Core analysis pipeline used by the BullMQ worker and by the Vercel
 * inline fallback when Redis is unavailable.
 */
export async function runAnalysisJob(data: AnalysisJobData) {
  const { projectId, sourceType, target } = data;

  let githubToken: string | null = null;
  if (sourceType === "GITHUB_REPO") {
    const session = await auth();
    if (session?.user?.id) {
      githubToken = await getUserGithubAccessToken(session.user.id);
    }
  }

  const analysisResult = await prisma.analysisResult.create({
    data: {
      projectId,
      status: "RUNNING",
      summary: `Analyzing ${sourceType === "GITHUB_REPO" ? "repository" : "API"} ${target}`,
      sourceRef: target,
      startedAt: new Date(),
    },
  });

  try {
    let context: string;
    let rawMetrics: Record<string, unknown> = {};
    let errorCount = 0;
    let latencyMsP95: number | null = null;

    if (sourceType === "GITHUB_REPO") {
      const { context: repoContext, snapshot } = await buildGithubContext(target, githubToken);
      context = repoContext;
      rawMetrics = { ...snapshot };
      errorCount = 0;
    } else {
      const apiResult = await buildApiContext(target);
      context = apiResult.context;
      rawMetrics = {
        reachable: apiResult.reachable,
        httpStatus: apiResult.httpStatus,
        latencyMs: apiResult.latencyMs,
        errorMessage: apiResult.errorMessage,
      };
      errorCount = apiResult.reachable && apiResult.httpStatus && apiResult.httpStatus < 400 ? 0 : 1;
      latencyMsP95 = apiResult.latencyMs;
    }

    const insight = await generateRepoInsight(context);
    const normalizedScore = Math.round(insight.score);

    await prisma.analysisResult.update({
      where: { id: analysisResult.id },
      data: {
        status: "COMPLETED",
        severity: insight.severity,
        aiScore: normalizedScore,
        summary: insight.summary,
        aiInsight: insight.suggestions,
        rawMetrics: rawMetrics as Prisma.InputJsonValue,
        errorCount,
        latencyMsP95,
        completedAt: new Date(),
      },
    });

    await maybeCreateRiskNotification({
      projectId,
      severity: insight.severity,
      score: normalizedScore,
      summary: insight.summary,
    });

    return { analysisResultId: analysisResult.id, mode: "completed" as const };
  } catch (error) {
    await prisma.analysisResult.update({
      where: { id: analysisResult.id },
      data: {
        status: "FAILED",
        summary: `Analysis failed: ${(error as Error).message}`,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
