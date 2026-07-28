import { describe, expect, it } from "vitest";
import { generateInvitationToken, getInvitationExpiryDate } from "@/lib/invitations";

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
  it("routes users without an organization to onboarding", async () => {
    const { getPostAuthRedirectPath } = await import("@/lib/auth-redirect");
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
