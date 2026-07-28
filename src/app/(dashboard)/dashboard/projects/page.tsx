import Link from "next/link";
import { ArrowRight, FolderGit2, Globe } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AnalyticsFilters } from "@/components/filters/AnalyticsFilters";
import { StatusBadge } from "@/components/insights/StatusBadge";
import { SeverityBadge } from "@/components/insights/SeverityBadge";
import { ScoreBadge } from "@/components/insights/ScoreBadge";
import { parseAnalyticsFilters, matchesAnalyticsFilters, type SearchParamsInput } from "@/lib/analytics-filters";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { formatDate } from "@/lib/utils";
import { ConnectRepoDialog } from "./ConnectRepoDialog";
import { AnalyzeButton } from "./AnalyzeButton";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ProjectsPageProps {
  searchParams: Promise<SearchParamsInput>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const filters = parseAnalyticsFilters(await searchParams);
  const organization = await getCurrentOrganization();
  const allProjects = await prisma.project.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: {
      analysisResults: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  const projects = allProjects.filter((project) =>
    matchesAnalyticsFilters(filters, {
      name: project.name,
      sourceType: project.sourceType,
      target: project.githubRepoUrl ?? project.apiUrl,
      latestCreatedAt: project.analysisResults[0]?.createdAt ?? null,
      latestSeverity: project.analysisResults[0]?.severity ?? null,
    })
  );

  return (
    <>
      <Header
        eyebrow="Auditoría automatizada"
        title="Proyectos"
        subtitle={`${projects.length} proyecto${projects.length === 1 ? "" : "s"} conectado${
          projects.length === 1 ? "" : "s"
        } en ${organization.name}`}
      />
      <div className="flex-1 space-y-4 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <AnalyticsFilters filters={filters} />
          <ConnectRepoDialog />
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          {projects.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Todavía no hay proyectos conectados. Conecta un repositorio de GitHub para comenzar.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                  <th className="px-5 py-3">Proyecto</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Severidad</th>
                  <th className="px-5 py-3">AI Score</th>
                  <th className="px-5 py-3">Última corrida</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {projects.map((project) => {
                  const latest = project.analysisResults[0];
                  const SourceIcon = project.sourceType === "GITHUB_REPO" ? FolderGit2 : Globe;
                  return (
                    <tr key={project.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-5 py-4">
                        <Link href={`/dashboard/projects/${project.id}`} className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <SourceIcon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
                          </span>
                          <span>
                            <span className="block font-medium text-zinc-900 dark:text-white">
                              {project.name}
                            </span>
                            <span className="block text-xs text-zinc-400">
                              {project.githubRepoUrl ?? project.apiUrl}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        {latest ? (
                          <StatusBadge status={latest.status} />
                        ) : (
                          <span className="text-xs text-zinc-400">Sin corridas</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {latest ? (
                          <SeverityBadge severity={latest.severity} />
                        ) : (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <ScoreBadge score={latest?.aiScore} />
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                        {latest ? formatDate(latest.createdAt) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <AnalyzeButton projectId={project.id} />
                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
