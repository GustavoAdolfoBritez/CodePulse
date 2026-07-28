import { isIP } from "node:net";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
]);

function isPrivateOrReservedIp(ip: string): boolean {
  const normalized = ip.toLowerCase();

  if (normalized === "::1" || normalized === "0.0.0.0") {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1)
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped?.[1]) {
    return isPrivateOrReservedIp(mapped[1]);
  }

  const parts = normalized.split(".").map(Number);
  if (parts.length === 4 && parts.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  }

  // Unique local / link-local IPv6
  if (normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80")) {
    return true;
  }

  return false;
}

/**
 * Validates outbound URLs used by analysis probes to reduce SSRF risk.
 * Only https is allowed for API endpoints; github.com for repo URLs.
 */
export function assertSafeOutboundUrl(rawUrl: string, options?: { allowHttp?: boolean }) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("URL inválida.");
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "https:" && !(options?.allowHttp && protocol === "http:")) {
    throw new Error("Solo se permiten URLs https.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost")) {
    throw new Error("Hostname no permitido.");
  }

  if (hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname === "[::1]") {
    throw new Error("Hostname no permitido.");
  }

  const ipVersion = isIP(hostname);
  if (ipVersion !== 0 && isPrivateOrReservedIp(hostname)) {
    throw new Error("No se permiten direcciones IP privadas o reservadas.");
  }

  // Block obvious cloud metadata hostnames
  if (hostname.includes("metadata") && hostname.includes("internal")) {
    throw new Error("Hostname no permitido.");
  }

  return parsed.toString();
}

export function assertSafeGithubRepoUrl(rawUrl: string) {
  const safe = assertSafeOutboundUrl(rawUrl);
  const parsed = new URL(safe);
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new Error("Solo se permiten repositorios de github.com.");
  }
  return `https://github.com${parsed.pathname.replace(/\/+$/, "")}`;
}
