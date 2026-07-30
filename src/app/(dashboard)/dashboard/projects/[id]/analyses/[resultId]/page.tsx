import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatusBadge } from "@/components/insights/StatusBadge";
import { SeverityBadge } from "@/components/insights/SeverityBadge";
import { ScoreBadge } from "@/components/insights/ScoreBadge";
import { MarkdownContent } from "@/components/insights/MarkdownContent";
import { AiModeBadge } from "@/components/insights/AiModeBadge";
import { getCurrentOrganization } from "@/lib/current-org";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface AnalysisDetailPageProps {
  params: Promise<{ id: string; resultId: string }>;
}

export default async function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  const { id, resultId } = await params;
  const organization = await getCurrentOrganization();

  const result = await prisma.analysisResult.findFirst({
    where: {
      id: resultId,
      projectId: id,
      project: { organizationId: organization.id },
    },
    include: {
      project: true,
    },
  });

  if (!result) {
    notFound();
  }

  return (
    <>
      <Header
        eyebrow={
          <Link
            href={`/dashboard/projects/${result.projectId}`}
            className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <ArrowLeft className="h-3 w-3" />
            {result.project.name}
          </Link>
        }
        title="Detalle de auditoría"
        subtitle={formatDate(result.createdAt)}
      />

      <div className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">{result.summary}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {result.completedAt
                ? `Completado ${formatDate(result.completedAt)}`
                : `Creado ${formatDate(result.createdAt)}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScoreBadge score={result.aiScore} size="lg" />
            <StatusBadge status={result.status} />
            <SeverityBadge severity={result.severity} />
            <AiModeBadge mode={result.aiMode} />
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
            Informe de la auditoría
          </h2>

          {result.status === "FAILED" ? (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950 dark:text-rose-300">
              Este análisis falló. Podés volver al proyecto y ejecutar uno nuevo.
            </p>
          ) : result.aiInsight ? (
            <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <MarkdownContent content={result.aiInsight} />
            </div>
          ) : result.status === "PENDING" || result.status === "RUNNING" ? (
            <p className="mt-4 text-sm text-zinc-400">Este análisis todavía se está procesando…</p>
          ) : (
            <p className="mt-4 text-sm text-zinc-400">No hay informe detallado para esta corrida.</p>
          )}
        </div>
      </div>
    </>
  );
}
