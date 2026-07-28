import { describe, expect, it } from "vitest";
import { matchesAnalyticsFilters, parseAnalyticsFilters } from "@/lib/analytics-filters";

describe("parseAnalyticsFilters", () => {
  it("normalizes supported query params and drops invalid values", () => {
    expect(
      parseAnalyticsFilters({
        q: "  checkout  ",
        severity: "high",
        sourceType: "api_endpoint",
        from: "2026-07-01",
        to: "2026-07-31",
      })
    ).toEqual({
      q: "checkout",
      severity: "HIGH",
      sourceType: "API_ENDPOINT",
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });
});

describe("matchesAnalyticsFilters", () => {
  it("matches by source type, severity and date range", () => {
    const filters = parseAnalyticsFilters({
      sourceType: "GITHUB_REPO",
      severity: "CRITICAL",
      from: "2026-07-01",
      to: "2026-07-31",
    });

    expect(
      matchesAnalyticsFilters(filters, {
        name: "octocat/Hello-World",
        sourceType: "GITHUB_REPO",
        target: "https://github.com/octocat/Hello-World",
        latestCreatedAt: new Date("2026-07-20T10:00:00Z"),
        latestSeverity: "CRITICAL",
      })
    ).toBe(true);

    expect(
      matchesAnalyticsFilters(filters, {
        name: "Acme Checkout API",
        sourceType: "API_ENDPOINT",
        target: "https://api.acme.dev/v1/checkout",
        latestCreatedAt: new Date("2026-07-20T10:00:00Z"),
        latestSeverity: "CRITICAL",
      })
    ).toBe(false);
  });
});
