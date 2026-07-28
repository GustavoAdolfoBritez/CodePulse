/**
 * Normalize REDIS_URL values that often get corrupted when pasted into
 * Vercel (wrapping quotes, encoded quotes, missing scheme).
 */
export function normalizeRedisUrl(raw: string | undefined): string {
  let url = (raw ?? "redis://localhost:6379").trim();

  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }

  // Accidental URL-encoded quotes from env paste (" → %22)
  url = url.replace(/^%22/i, "").replace(/%22$/i, "").trim();

  // If the scheme was eaten by a leading quote, restore TLS Upstash URL.
  if (url.startsWith("//")) {
    url = `rediss:${url}`;
  }

  return url;
}
