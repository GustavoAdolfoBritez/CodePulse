import {
  AlertTriangle,
  BellRing,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { format, startOfMonth, startOfWeek, subWeeks } from "date-fns";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { PerformanceChart } from "@/components/charts/PerformanceChart";
import type { PerformanceDataPoint } from "@/types";
import { prisma } from "@/lib/prisma";
import { getCurrentOrganization } from "@/lib/current-org";
import { formatNumber } from "@/lib/utils";
import { BatchAuditButton } from "./BatchAuditButton";

export const dynamic = "force-dynamic";

function getDelta(current: number, previous: number): { text: string; type: "increase" | "decrease" | "unchanged" } {
  if (previous === 0) {
    return { text: "0% vs. período anterior", type: "unchanged" };
  }

  const diff = ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.5) {
    return { text: "0% vs. período anterior", type: "unchanged" };
  }

  return {
    text: `${diff > 0 ? "+" : ""}${Math.round(diff)}% vs. período anterior`,
    type: diff > 0 ? "increase" : "decrease",
  };
}

export default async function DashboardPage() {
  const organization = await getCurrentOrganization();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const trendStart = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 });

  const [projects, analysesThisMonth, unreadNotifications, trendResults] = await Promise.all([
    prisma.project.findMany({
      where: { organizationId: organization.id },
      include: {
        analysisResults: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.analysisResult.count({
      where: {
        project: { organizationId: organization.id },
        status: { in: ["COMPLETED", "FAILED"] },
        createdAt: { gte: monthStart },
      },
    }),
    prisma.notification.count({
      where: { organizationId: organization.id, read: false },
    }),
    prisma.analysisResult.findMany({
      where: {
        project: { organizationId: organization.id },
        aiScore: { not: null },
        createdAt: { gte: trendStart },
      },
      select: {
        aiScore: true,
        errorCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const latestResults = projects
    .map((project) => project.analysisResults[0])
    .filter((result): result is NonNullable<(typeof projects)[number]["analysisResults"][number]> => Boolean(result));

  const scoredResults = latestResults.filter((result) => typeof result.aiScore === "number");
  const averageHealth = scoredResults.length
    ? Math.round(scoredResults.reduce((sum, result) => sum + (result.aiScore ?? 0), 0) / scoredResults.length)
    : 0;
  const projectsAtRisk = latestResults.filter(
    (result) => result.severity === "HIGH" || result.severity === "CRITICAL"
  ).length;

  const weeklyBuckets = new Map<string, { date: string; totalScore: number; count: number; analyses: number }>();
  for (let index = 7; index >= 0; index -= 1) {
    const week = startOfWeek(subWeeks(now, index), { weekStartsOn: 1 });
    const key = week.toISOString();
    weeklyBuckets.set(key, {
      date: format(week, "MMM d"),
      totalScore: 0,
      count: 0,
      analyses: 0,
    });
  }

  for (const result of trendResults) {
    const week = startOfWeek(result.createdAt, { weekStartsOn: 1 }).toISOString();
    const bucket = weeklyBuckets.get(week);
    if (!bucket || typeof result.aiScore !== "number") {
      continue;
    }
    bucket.totalScore += result.aiScore;
    bucket.count += 1;
    bucket.analyses += 1;
  }

  const chartData: PerformanceDataPoint[] = Array.from(weeklyBuckets.values()).map((bucket) => ({
    date: bucket.date,
    "Salud promedio": bucket.count ? Math.round(bucket.totalScore / bucket.count) : 0,
    Análisis: bucket.analyses,
  }));

  const currentWeekScore = Number(chartData[chartData.length - 1]?.["Salud promedio"] ?? 0);
  const previousWeekScore = Number(chartData[chartData.length - 2]?.["Salud promedio"] ?? currentWeekScore);
  const healthDelta = getDelta(currentWeekScore, previousWeekScore || currentWeekScore || 1);

  const analysesCurrentWindow = chartData.slice(-4).reduce((sum, row) => sum + Number(row["Análisis"] ?? 0), 0);
  const analysesPreviousWindow = chartData
    .slice(Math.max(chartData.length - 8, 0), Math.max(chartData.length - 4, 0))
    .reduce((sum, row) => sum + Number(row["Análisis"] ?? 0), 0);
  const analysesDelta = getDelta(analysesCurrentWindow, analysesPreviousWindow || analysesCurrentWindow || 1);

  const riskTrend = chartData.map((row) => Number(row["Salud promedio"] ?? 0));

  return (
    <>
      <Header
        eyebrow="Overview"
        title="Overview"
        subtitle="Estado general de tus repositorios y APIs monitoreadas"
        actions={<BatchAuditButton />}
      />
      <main className="flex-1 space-y-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Salud promedio del código"
            metric={`${averageHealth}/100`}
            delta={healthDelta.text}
            deltaType={healthDelta.type}
            icon={ShieldAlert}
            trend={chartData.map((row) => Number(row["Salud promedio"] ?? 0))}
          />
          <StatCard
            title="Proyectos en riesgo"
            metric={String(projectsAtRisk)}
            icon={AlertTriangle}
            trend={riskTrend}
          />
          <StatCard
            title="Análisis ejecutados (mes)"
            metric={formatNumber(analysesThisMonth)}
            delta={analysesDelta.text}
            deltaType={analysesDelta.type}
            icon={Sparkles}
            trend={chartData.map((row) => Number(row["Análisis"] ?? 0))}
          />
          <StatCard
            title="Alertas no leídas"
            metric={String(unreadNotifications)}
            icon={BellRing}
            trend={[Math.max(unreadNotifications - 2, 0), Math.max(unreadNotifications - 1, 0), unreadNotifications]}
          />
        </div>

        <PerformanceChart
          data={chartData}
          title="Tendencia de salud del código"
          metricLabel="Salud promedio"
          metricSuffix="/100"
          categories={["Salud promedio", "Análisis"]}
          colors={["indigo", "emerald"]}
          delta={healthDelta.text}
          deltaType={healthDelta.type}
          rangeLabel="Últimas 8 semanas"
        />

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Resumen operativo</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-zinc-400">Proyectos conectados</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">{projects.length}</p>
              </div>
              <div>
                <p className="text-zinc-400">Con score disponible</p>
                <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-white">
                  {scoredResults.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Estado de la auditoría global</p>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Usa <span className="font-medium text-zinc-700 dark:text-zinc-200">Ejecutar Auditoría Global</span> para
              encolar todos los proyectos de la organización en paralelo sobre BullMQ y refrescar estas métricas en
              tiempo real.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
