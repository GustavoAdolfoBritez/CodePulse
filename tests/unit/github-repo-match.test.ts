import { describe, expect, it } from "vitest";
import { matchesGithubFullName } from "@/lib/github-repo-match";

describe("matchesGithubFullName", () => {
  it("matches canonical github URLs", () => {
    expect(
      matchesGithubFullName("https://github.com/Acme/Api", "acme/api")
    ).toBe(true);
  });

  it("matches owner/repo shorthand stored as URL path", () => {
    expect(matchesGithubFullName("https://github.com/acme/api.git", "acme/api")).toBe(true);
  });

  it("rejects different repos", () => {
    expect(matchesGithubFullName("https://github.com/acme/api", "acme/other")).toBe(false);
  });

  it("handles nulls", () => {
    expect(matchesGithubFullName(null, "acme/api")).toBe(false);
    expect(matchesGithubFullName("https://github.com/acme/api", null)).toBe(false);
  });
});
