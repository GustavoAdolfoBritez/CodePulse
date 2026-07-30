import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, FolderGit2, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/insights/StatusBadge";
import { SeverityBadge } from "@/components/insights/SeverityBadge";
import { ScoreBadge } from "@/components/insights/ScoreBadge";
import { MarkdownContent } from "@/components/insights/MarkdownContent";
import { getCurrentOrganization } from "@/lib/current-org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { AnalyzeButton } from "../AnalyzeButton";
import { AiModeBadge } from "@/components/insights/AiModeBadge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const organization = await getCurrentOrganization();

  const project = await prisma.project.findFirst({
    where: { id, organizationId: organization.id },
    include: {
      analysisResults: { orderBy: { createdAt: "desc" } },
      organization: true,
    },
  });

  if (!project) {
    notFound();
  }

  const latest = project.analysisResults[0];
  const SourceIcon = project.sourceType === "GITHUB_REPO" ? FolderGit2 : Globe;

  return (
    <>
      <Header
        eyebrow={
          <Link
            href="/dashboard/projects"
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-3 w-3" />
            Proyectos
          </Link>
        }
        title={project.name}
        subtitle={project.githubRepoUrl ?? project.apiUrl ?? undefined}
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <SourceIcon className="h-5 w-5 text-zinc-500 dark:text-zinc-400" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">
                {project.sourceType === "GITHUB_REPO" ? "Repositorio de GitHub" : "Endpoint de API"}
              </p>
              <p className="text-xs text-zinc-400">Conectado el {formatDate(project.createdAt)}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {latest ? (
              <>
                <ScoreBadge score={latest.aiScore} size="lg" />
                <div className="flex flex-col gap-1.5">
                  <StatusBadge status={latest.status} />
                  <SeverityBadge severity={latest.severity} />
                </div>
              </>
            ) : (
              <p className="text-sm text-zinc-400">Sin análisis todavía</p>
            )}
            <AnalyzeButton projectId={project.id} />
          </div>
        </div>

        {latest ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Insight más reciente
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <AiModeBadge mode={latest.aiMode} />
                <Link
                  href={`/dashboard/projects/${project.id}/analyses/${latest.id}`}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Ver en página completa
                </Link>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{latest.summary}</p>
            <p className="mt-1 text-xs text-zinc-400">{formatDate(latest.createdAt)}</p>

            {latest.status === "FAILED" ? (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-300">
                El análisis falló. Intenta de nuevo con &quot;Analizar ahora&quot;.
              </p>
            ) : latest.aiInsight ? (
              <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <MarkdownContent content={latest.aiInsight} />
              </div>
            ) : (
              <p className="mt-4 text-sm text-zinc-400">Procesando en segundo plano…</p>
            )}
          </div>
        ) : null}

        {project.analysisResults.length > 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-4 py-4 sm:px-6 dark:border-zinc-800">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
                Historial de análisis
              </h2>
              <p className="mt-1 text-xs text-zinc-400">
                Tocá un análisis para ver el informe completo de esa corrida.
              </p>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {project.analysisResults.map((result) => (
                <li key={result.id}>
                  <Link
                    href={`/dashboard/projects/${project.id}/analyses/${result.id}`}
                    className="flex flex-col gap-3 px-4 py-4 transition-colors hover:bg-zinc-50 sm:flex-row sm:items-center sm:gap-4 sm:px-6 dark:hover:bg-zinc-800/50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <ScoreBadge score={result.aiScore} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-700 dark:text-zinc-200">{result.summary}</p>
                        <p className="mt-0.5 text-xs text-zinc-400">{formatDate(result.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AiModeBadge mode={result.aiMode} />
                      <StatusBadge status={result.status} />
                      <SeverityBadge severity={result.severity} />
                      <ChevronRight className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </>
  );
}
