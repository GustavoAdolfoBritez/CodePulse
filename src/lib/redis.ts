import IORedis, { type Redis } from "ioredis";

/**
 * Shared Redis connection used both for BullMQ queues/workers and any
 * ad-hoc caching. BullMQ requires `maxRetriesPerRequest: null` on the
 * connection it manages.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export function getRedisConnection(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new IORedis(
      process.env.REDIS_URL ?? "redis://localhost:6379",
      {
        maxRetriesPerRequest: null,
      }
    );
  }
  return globalForRedis.redis;
}
