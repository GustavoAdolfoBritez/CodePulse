import { getRedisConnection } from "@/lib/redis";

/** Shared connection options passed to every BullMQ Queue/Worker/QueueEvents. */
export const queueConnection = getRedisConnection();
