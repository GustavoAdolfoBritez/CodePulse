/**
 * Standalone BullMQ worker process.
 *
 * Run with `npm run worker` (see package.json). Kept separate from the
 * Next.js server so heavy repo/API analysis never blocks request handling
 * and can be scaled independently (e.g. more worker replicas).
 */
import "dotenv/config";
import { Worker, type Job } from "bullmq";
import { getQueueConnection } from "@/server/queue/connection";
import { QUEUE_NAMES, type AnalysisJobData } from "@/server/queue/queues";
import { runAnalysisJob } from "@/server/analysis/run-analysis";

async function processAnalysisJob(job: Job<AnalysisJobData>) {
  await runAnalysisJob(job.data);
}

const worker = new Worker<AnalysisJobData>(
  QUEUE_NAMES.ANALYSIS,
  processAnalysisJob,
  { connection: getQueueConnection(), concurrency: 5 }
);

worker.on("completed", (job) => {
  console.log(`[worker] job ${job.id} completed for project ${job.data.projectId}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] job ${job?.id} failed:`, err.message);
});

console.log(`[worker] analysis worker started on queue "${QUEUE_NAMES.ANALYSIS}", waiting for jobs...`);
