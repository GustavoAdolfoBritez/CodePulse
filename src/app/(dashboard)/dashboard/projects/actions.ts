"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { normalizeRepoInput, parseRepoUrl } from "@/lib/github";
import { assertSafeGithubRepoUrl } from "@/lib/url-safety";
import { enqueueOrRunAnalysis } from "@/server/analysis/enqueue-or-run";
import type { ActionState } from "./action-types";

const connectRepoSchema = z.object({
  input: z.string().trim().min(3, "Ingresa una URL o el nombre owner/repo del repositorio."),
});

/**
 * Server Action for the "Connect new GitHub repository" form. Creates the
 * Project and, per the async pipeline requirement, immediately enqueues a
 * Job on `analyze-repo-queue` so the BullMQ worker picks it up in the
 * background.
 */
export async function createProjectAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = connectRepoSchema.safeParse({ input: formData.get("input") });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Entrada inválida." };
  }

  let githubRepoUrl: string;
  let owner: string;
  let repo: string;
  try {
    githubRepoUrl = assertSafeGithubRepoUrl(normalizeRepoInput(parsed.data.input));
    ({ owner, repo } = parseRepoUrl(githubRepoUrl));
  } catch {
    return {
      success: false,
      error: "No se pudo interpretar el repositorio. Usa el formato owner/repo o una URL de GitHub.",
    };
  }

  const organization = await getCurrentOrganization();

  const existing = await prisma.project.findFirst({
    where: { organizationId: organization.id, githubRepoUrl },
  });
  if (existing) {
    return { success: false, error: "Ese repositorio ya está conectado a esta organización." };
  }

  const project = await prisma.project.create({
    data: {
      name: `${owner}/${repo}`,
      sourceType: "GITHUB_REPO",
      githubRepoUrl,
      organizationId: organization.id,
    },
  });

  try {
    await enqueueOrRunAnalysis({
      projectId: project.id,
      sourceType: "GITHUB_REPO",
      target: githubRepoUrl,
    });
  } catch (error) {
    console.error("[createProjectAction] analysis failed", error);
  }

  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard");

  return { success: true, error: null };
}

/**
 * Server Action for the "Analizar ahora" button on an existing project.
 * Re-enqueues a Job on `analyze-repo-queue` for that project.
 */
export async function triggerAnalysisAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const organization = await getCurrentOrganization();
  const projectId = formData.get("projectId");
  if (typeof projectId !== "string" || !projectId) {
    return { success: false, error: "Proyecto inválido." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId: organization.id },
  });
  if (!project) {
    return { success: false, error: "Proyecto no encontrado." };
  }

  const target = project.githubRepoUrl ?? project.apiUrl ?? "";
  if (!target) {
    return { success: false, error: "El proyecto no tiene una fuente configurada." };
  }

  try {
    await enqueueOrRunAnalysis({
      projectId: project.id,
      sourceType: project.sourceType,
      target,
    });
  } catch (error) {
    console.error("[triggerAnalysisAction] analysis failed", error);
    return {
      success: false,
      error: "No se pudo completar el análisis. Reintenta en unos segundos.",
    };
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${project.id}`);
  revalidatePath("/dashboard/insights");
  revalidatePath("/dashboard");

  return { success: true, error: null };
}
