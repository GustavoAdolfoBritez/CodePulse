import IORedis, { type Redis } from "ioredis";
import { normalizeRedisUrl } from "@/lib/redis-url";

/**
 * Shared Redis connection used both for BullMQ queues/workers and any
 * ad-hoc caching. BullMQ requires `maxRetriesPerRequest: null` on the
 * connection it manages.
 *
 * On Vercel serverless we must fail fast: a bad/unreachable REDIS_URL
 * used to hang `Queue.add` for minutes and freeze the "Conectar" button.
 */
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export function getRedisConnection(): Redis {
  if (!globalForRedis.redis) {
    const url = normalizeRedisUrl(process.env.REDIS_URL);

    globalForRedis.redis = new IORedis(url, {
      maxRetriesPerRequest: null,
      connectTimeout: 5_000,
      enableOfflineQueue: false,
      lazyConnect: true,
      // Prefer IPv4 on serverless hosts that struggle with Upstash IPv6.
      family: 4,
      retryStrategy(times) {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 1_000);
      },
    });

    globalForRedis.redis.on("error", (error) => {
      // Avoid logging full URLs/passwords if ioredis includes them.
      console.error("[redis] connection error", error.message.split("@").pop() ?? error.message);
    });
  }

  return globalForRedis.redis;
}
