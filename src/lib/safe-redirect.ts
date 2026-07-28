/**
 * Prevents open redirects by allowing only same-origin relative paths.
 * Rejects absolute URLs, protocol-relative URLs (`//evil.com`), and
 * anything that is not a single-path redirect inside the app.
 */
export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback: string
): string {
  if (!candidate) {
    return fallback;
  }

  const value = candidate.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  // Block embedded credentials / schemes smuggled after the first slash.
  if (value.includes("://")) {
    return fallback;
  }

  try {
    const url = new URL(value, "http://localhost");
    if (url.origin !== "http://localhost") {
      return fallback;
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
