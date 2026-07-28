import { enqueueAnalysisJob, type AnalysisJobData } from "@/server/queue/queues";
import { runAnalysisJob } from "@/server/analysis/run-analysis";

function shouldRunInline(): boolean {
  // Explicit override.
  if (process.env.ANALYSIS_MODE === "inline") return true;
  if (process.env.ANALYSIS_MODE === "queue") return false;
  // Vercel has no long-lived BullMQ worker unless hosted separately.
  // Queuing-only made "Analizar ahora" look like a no-op.
  return process.env.VERCEL === "1";
}

/**
 * On Vercel (no worker process), run analysis inline.
 * Elsewhere, prefer BullMQ and fall back to inline if Redis is down.
 */
export async function enqueueOrRunAnalysis(data: AnalysisJobData) {
  if (shouldRunInline()) {
    await runAnalysisJob(data);
    return { mode: "inline" as const, jobId: null };
  }

  try {
    const job = await enqueueAnalysisJob(data);
    return { mode: "queued" as const, jobId: job.id };
  } catch (error) {
    console.warn(
      "[analysis] Redis enqueue failed; running inline fallback",
      error instanceof Error ? error.message : error
    );
    await runAnalysisJob(data);
    return { mode: "inline" as const, jobId: null };
  }
}
