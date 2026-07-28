import { Queue } from "bullmq";
import { queueConnection } from "./connection";

export const QUEUE_NAMES = {
  ANALYSIS: "analyze-repo-queue",
} as const;

export interface AnalysisJobData {
  projectId: string;
  /** Which kind of source is being analyzed, mirrors Prisma's ProjectSourceType. */
  sourceType: "GITHUB_REPO" | "API_ENDPOINT";
  /** Repo URL, API URL, or a pointer to a batch of logs to fetch/analyze. */
  target: string;
  triggeredBy?: string;
}

/**
 * Queue used to offload heavy repository/API analysis so HTTP requests
 * stay fast. A Worker (see src/server/workers/analysis.worker.ts) consumes
 * this queue in a separate process (`npm run worker`).
 */
export const analysisQueue = new Queue<AnalysisJobData>(QUEUE_NAMES.ANALYSIS, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { age: 24 * 3600, count: 1_000 },
    removeOnFail: { age: 7 * 24 * 3600 },
  },
});

export async function enqueueAnalysisJob(data: AnalysisJobData) {
  return analysisQueue.add("analyze-project", data);
}
