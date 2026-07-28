import Link from "next/link";
import { ArrowRight, FolderGit2, Globe, Sparkles } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AnalyticsFilters } from "@/components/filters/AnalyticsFilters";
import { StatusBadge } from "@/components/insights/StatusBadge";
import { SeverityBadge } from "@/components/insights/SeverityBadge";
import { ScoreBadge } from "@/components/insights/ScoreBadge";
import { MarkdownContent } from "@/components/insights/MarkdownContent";
import { matchesAnalyticsFilters, parseAnalyticsFilters, type SearchParamsInput } from "@/lib/analytics-filters";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface InsightsPageProps {
  searchParams: Promise<SearchParamsInput>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const filters = parseAnalyticsFilters(await searchParams);
  const organization = await getCurrentOrganization();

  const allProjects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    include: {
      analysisResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const feed = allProjects
    .filter((project) => project.analysisResults.length > 0)
    .filter((project) =>
      matchesAnalyticsFilters(filters, {
        name: project.name,
        sourceType: project.sourceType,
        target: project.githubRepoUrl ?? project.apiUrl,
        latestCreatedAt: project.analysisResults[0]?.createdAt ?? null,
        latestSeverity: project.analysisResults[0]?.severity ?? null,
      })
    )
    .map((project) => ({ project, result: project.analysisResults[0] }))
    .sort((a, b) => b.result.createdAt.getTime() - a.result.createdAt.getTime());

  return (
    <>
      <Header
        eyebrow="Análisis con IA"
        title="Insights"
        subtitle="Últimos hallazgos generados automáticamente por el motor de IA para cada proyecto conectado."
      />

      <div className="flex-1 space-y-4 p-6">
        <AnalyticsFilters filters={filters} />
        {feed.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <Sparkles className="mx-auto mb-3 h-6 w-6 text-zinc-300 dark:text-zinc-600" />
            Todavía no hay insights generados. Conecta un proyecto y ejecuta un análisis desde{" "}
            <Link href="/dashboard/projects" className="font-medium text-indigo-600 hover:underline">
              Proyectos
            </Link>
            .
          </div>
        ) : (
          feed.map(({ project, result }) => {
            const SourceIcon = project.sourceType === "GITHUB_REPO" ? FolderGit2 : Globe;
            return (
              <div
                key={result.id}
                className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <SourceIcon className="h-4.5 w-4.5 text-zinc-500 dark:text-zinc-400" />
                    </span>
                    <div>
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="text-sm font-semibold text-zinc-900 hover:underline dark:text-white"
                      >
                        {project.name}
                      </Link>
                      <p className="text-xs text-zinc-400">{formatDate(result.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={result.status} />
                    <SeverityBadge severity={result.severity} />
                    <ScoreBadge score={result.aiScore} />
                  </div>
                </div>

                <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {result.summary}
                </p>

                {result.aiInsight ? (
                  <div className="mt-3 line-clamp-4 overflow-hidden">
                    <MarkdownContent content={result.aiInsight} />
                  </div>
                ) : null}

                <Link
                  href={`/dashboard/projects/${project.id}`}
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  Ver detalle completo
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
