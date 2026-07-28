import type { Redis } from "ioredis";
import { getRedisConnection } from "@/lib/redis";

/** Shared Redis connection for BullMQ Queue/Worker/QueueEvents. */
export function getQueueConnection(): Redis {
  return getRedisConnection();
}
