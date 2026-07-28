type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Lightweight in-memory rate limiter for auth endpoints.
 * Note: serverless instances do not share memory, so this is best-effort
 * protection (still useful against casual abuse on a single instance).
 */
export function consumeRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const existing = buckets.get(args.key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(args.key, { count: 1, resetAt: now + args.windowMs });
    return { ok: true };
  }

  if (existing.count >= args.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(args.key, existing);
  return { ok: true };
}
