import { parseRepoUrl } from "@/lib/github";

/**
 * True when a stored project URL points at the same repo as a GitHub
 * `repository.full_name` (e.g. "acme/api").
 */
export function matchesGithubFullName(
  githubRepoUrl: string | null | undefined,
  fullName: string | null | undefined
): boolean {
  if (!githubRepoUrl || !fullName) {
    return false;
  }

  const normalizedFullName = fullName.trim().toLowerCase().replace(/\.git$/, "");

  try {
    const withProtocol = githubRepoUrl.startsWith("http")
      ? githubRepoUrl
      : `https://github.com/${githubRepoUrl}`;
    const { owner, repo } = parseRepoUrl(withProtocol);
    return `${owner}/${repo}`.toLowerCase() === normalizedFullName;
  } catch {
    return false;
  }
}
