import { Queue } from "bullmq";
import { getQueueConnection } from "./connection";

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
  /** Optional commit SHA / PR head for provenance. */
  sourceRef?: string;
  /** Prefer this token for GitHub API (webhooks have no user session). */
  githubAccessToken?: string;
}

const ENQUEUE_TIMEOUT_MS = 8_000;

let analysisQueue: Queue<AnalysisJobData> | null = null;

function getAnalysisQueue() {
  if (!analysisQueue) {
    analysisQueue = new Queue<AnalysisJobData>(QUEUE_NAMES.ANALYSIS, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 5_000 },
        removeOnComplete: { age: 24 * 3600, count: 1_000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
  }
  return analysisQueue;
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Enqueue analysis work. Never hang forever — Redis misconfig on Vercel
 * previously blocked the "Conectar" UI for minutes.
 */
export async function enqueueAnalysisJob(data: AnalysisJobData) {
  const redis = getQueueConnection();

  if (redis.status === "wait" || redis.status === "end") {
    await withTimeout(redis.connect(), ENQUEUE_TIMEOUT_MS, "Redis connect");
  } else if (redis.status === "connecting") {
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        const onReady = () => {
          cleanup();
          resolve();
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const cleanup = () => {
          redis.off("ready", onReady);
          redis.off("error", onError);
        };
        redis.once("ready", onReady);
        redis.once("error", onError);
      }),
      ENQUEUE_TIMEOUT_MS,
      "Redis connect"
    );
  }

  return withTimeout(
    getAnalysisQueue().add("analyze-project", data),
    ENQUEUE_TIMEOUT_MS,
    "Redis enqueue"
  );
}
