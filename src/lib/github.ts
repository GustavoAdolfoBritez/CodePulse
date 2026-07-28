import { Octokit } from "@octokit/rest";

/**
 * Creates an authenticated Octokit client. Pass a per-organization
 * installation token when available; falls back to a server-wide
 * GITHUB_TOKEN for local development / demos. Works unauthenticated too
 * (public repos, subject to GitHub's low rate limit).
 */
export function createGithubClient(token?: string) {
  const auth = token ?? process.env.GITHUB_TOKEN;
  return new Octokit(auth ? { auth } : {});
}

export function parseRepoUrl(githubRepoUrl: string): { owner: string; repo: string } {
  const { pathname } = new URL(githubRepoUrl);
  const [, owner, repo] = pathname.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid GitHub repository URL: ${githubRepoUrl}`);
  }
  return { owner, repo: repo.replace(/\.git$/, "") };
}

/**
 * Accepts a full GitHub URL, a bare "owner/repo", or a "github.com/owner/repo"
 * string (as typed by a user in the "Connect repository" form) and returns a
 * canonical `https://github.com/owner/repo` URL.
 */
export function normalizeRepoInput(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, "");

  const shorthand = /^([\w.-]+)\/([\w.-]+)$/.exec(trimmed);
  if (shorthand) {
    const [, owner, repo] = shorthand;
    return `https://github.com/${owner}/${repo.replace(/\.git$/, "")}`;
  }

  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  const { owner, repo } = parseRepoUrl(withProtocol);
  return `https://github.com/${owner}/${repo}`;
}

export interface RepoCommitSummary {
  sha: string;
  message: string;
  author: string | null;
  date: string | null;
}

export interface RepoSnapshot {
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string | null;
  rootEntries: string[];
  commits: RepoCommitSummary[];
}

/**
 * Fetches a lightweight snapshot of a public GitHub repository: metadata,
 * the top-level file/folder listing, and the most recent commits. Used as
 * the raw context an LLM analyzes to produce an AnalysisResult.
 */
export async function fetchRepoSnapshot(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoSnapshot> {
  const octokit = createGithubClient(token);

  const { data: repoData } = await octokit.repos.get({ owner, repo });

  const [commitsResult, contentsResult] = await Promise.allSettled([
    octokit.repos.listCommits({ owner, repo, per_page: 10 }),
    octokit.repos.getContent({ owner, repo, path: "" }),
  ]);

  const commits: RepoCommitSummary[] =
    commitsResult.status === "fulfilled"
      ? commitsResult.value.data.map((c) => ({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split("\n")[0],
          author: c.commit.author?.name ?? c.author?.login ?? null,
          date: c.commit.author?.date ?? null,
        }))
      : [];

  const rootEntries: string[] =
    contentsResult.status === "fulfilled" && Array.isArray(contentsResult.value.data)
      ? contentsResult.value.data.map((entry) => entry.name)
      : [];

  return {
    fullName: repoData.full_name,
    description: repoData.description,
    language: repoData.language,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    openIssues: repoData.open_issues_count,
    defaultBranch: repoData.default_branch,
    pushedAt: repoData.pushed_at,
    rootEntries,
    commits,
  };
}
