import { describe, expect, it } from "vitest";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { assertSafeGithubRepoUrl, assertSafeOutboundUrl } from "@/lib/url-safety";
import { passwordSchema } from "@/lib/password-policy";
import { generateInvitationToken, getInvitationExpiryDate } from "@/lib/invitations";
import { getPostAuthRedirectPath } from "@/lib/auth-redirect";

describe("safe redirects", () => {
  it("allows relative same-origin paths", () => {
    expect(getSafeRedirectPath("/dashboard", "/fallback")).toBe("/dashboard");
    expect(getSafeRedirectPath("/invite/abc?x=1", "/fallback")).toBe("/invite/abc?x=1");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(getSafeRedirectPath("https://evil.com", "/fallback")).toBe("/fallback");
    expect(getSafeRedirectPath("//evil.com", "/fallback")).toBe("/fallback");
    expect(getSafeRedirectPath("\\\\evil.com", "/fallback")).toBe("/fallback");
  });
});

describe("url safety", () => {
  it("allows public https endpoints", () => {
    expect(assertSafeOutboundUrl("https://api.example.com/v1/health")).toContain("https://");
  });

  it("blocks private and localhost targets", () => {
    expect(() => assertSafeOutboundUrl("http://127.0.0.1/secret")).toThrow();
    expect(() => assertSafeOutboundUrl("https://localhost/admin")).toThrow();
    expect(() => assertSafeOutboundUrl("https://192.168.1.10/metrics")).toThrow();
    expect(() => assertSafeOutboundUrl("https://169.254.169.254/latest/meta-data")).toThrow();
  });

  it("only allows github.com for repo URLs", () => {
    expect(assertSafeGithubRepoUrl("https://github.com/vercel/next.js")).toBe(
      "https://github.com/vercel/next.js"
    );
    expect(() => assertSafeGithubRepoUrl("https://evil.com/vercel/next.js")).toThrow();
  });
});

describe("password policy", () => {
  it("requires length, letters and numbers", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("password").success).toBe(false);
    expect(passwordSchema.safeParse("password123").success).toBe(true);
  });
});

describe("invitations", () => {
  it("generates unique-looking tokens", () => {
    const a = generateInvitationToken();
    const b = generateInvitationToken();
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(32);
  });

  it("sets invitation expiry in the future", () => {
    const expiry = getInvitationExpiryDate();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });
});

describe("auth redirect helper", () => {
  it("routes users without an organization to onboarding", () => {
    expect(getPostAuthRedirectPath(null)).toBe("/onboarding");
    expect(getPostAuthRedirectPath(undefined)).toBe("/onboarding");
    expect(getPostAuthRedirectPath("org_123")).toBe("/dashboard");
  });
});

describe("github oauth config", () => {
  it("detects when github oauth env vars are missing", async () => {
    const originalClientId = process.env.GITHUB_CLIENT_ID;
    const originalClientSecret = process.env.GITHUB_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;

    const { isGithubOAuthConfigured } = await import("@/lib/github-oauth");
    expect(isGithubOAuthConfigured()).toBe(false);

    process.env.GITHUB_CLIENT_ID = originalClientId;
    process.env.GITHUB_CLIENT_SECRET = originalClientSecret;
  });
});
