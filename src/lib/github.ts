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

export interface RepoHealthSignals {
  hasReadme: boolean;
  hasLicense: boolean;
  hasCiWorkflows: boolean;
  workflowFiles: string[];
  hasDependabot: boolean;
  hasCodeowners: boolean;
  hasSecurityPolicy: boolean;
  hasDockerfile: boolean;
  hasEnvExample: boolean;
  hasLockfile: boolean;
  hasEslint: boolean;
  hasTestsHint: boolean;
  packageManager: string | null;
  dependencyCount: number | null;
  devDependencyCount: number | null;
  npmScripts: string[];
  openPullRequests: number | null;
  languages: Record<string, number>;
  topics: string[];
  licenseSpdx: string | null;
  visibility: string | null;
  archived: boolean;
  isFork: boolean;
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
  health: RepoHealthSignals;
}

function decodeBase64Content(encoded: string | undefined): string {
  if (!encoded) {
    return "";
  }
  return Buffer.from(encoded, "base64").toString("utf8");
}

function detectPackageSignals(rootEntries: string[], packageJsonRaw: string | null) {
  const lowerRoots = rootEntries.map((entry) => entry.toLowerCase());
  const hasLockfile = lowerRoots.some((entry) =>
    ["package-lock.json", "yarn.lock", "pnpm-lock.yaml", "bun.lockb", "composer.lock", "poetry.lock"].includes(
      entry
    )
  );
  const hasEslint = lowerRoots.some(
    (entry) => entry.includes("eslint") || entry === ".eslintrc" || entry === "eslint.config.js"
  );
  const hasTestsHint = lowerRoots.some(
    (entry) =>
      entry.includes("test") ||
      entry.includes("spec") ||
      entry === "__tests__" ||
      entry === "tests"
  );
  const hasEnvExample = lowerRoots.some(
    (entry) => entry === ".env.example" || entry === ".env.sample" || entry === ".env.template"
  );
  const hasDockerfile = lowerRoots.some(
    (entry) => entry === "dockerfile" || entry === "docker-compose.yml" || entry === "compose.yml"
  );

  let packageManager: string | null = null;
  if (lowerRoots.includes("pnpm-lock.yaml")) packageManager = "pnpm";
  else if (lowerRoots.includes("yarn.lock")) packageManager = "yarn";
  else if (lowerRoots.includes("bun.lockb")) packageManager = "bun";
  else if (lowerRoots.includes("package-lock.json")) packageManager = "npm";
  else if (lowerRoots.includes("package.json")) packageManager = "npm?";

  let dependencyCount: number | null = null;
  let devDependencyCount: number | null = null;
  let npmScripts: string[] = [];

  if (packageJsonRaw) {
    try {
      const parsed = JSON.parse(packageJsonRaw) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        scripts?: Record<string, string>;
      };
      dependencyCount = Object.keys(parsed.dependencies ?? {}).length;
      devDependencyCount = Object.keys(parsed.devDependencies ?? {}).length;
      npmScripts = Object.keys(parsed.scripts ?? {}).slice(0, 20);
      if (!packageManager) {
        packageManager = "npm";
      }
    } catch {
      // ignore malformed package.json
    }
  }

  return {
    hasLockfile,
    hasEslint,
    hasTestsHint,
    hasEnvExample,
    hasDockerfile,
    packageManager,
    dependencyCount,
    devDependencyCount,
    npmScripts,
  };
}

/**
 * Fetches an enriched snapshot of a GitHub repository used as LLM context:
 * metadata, root listing, commits, workflows, package.json signals, languages.
 */
export async function fetchRepoSnapshot(
  owner: string,
  repo: string,
  token?: string
): Promise<RepoSnapshot> {
  const octokit = createGithubClient(token);

  const { data: repoData } = await octokit.repos.get({ owner, repo });

  const [
    commitsResult,
    contentsResult,
    languagesResult,
    pullsResult,
    workflowsResult,
    packageJsonResult,
    dependabotResult,
    codeownersResult,
    securityResult,
  ] = await Promise.allSettled([
    octokit.repos.listCommits({ owner, repo, per_page: 12 }),
    octokit.repos.getContent({ owner, repo, path: "" }),
    octokit.repos.listLanguages({ owner, repo }),
    octokit.pulls.list({ owner, repo, state: "open", per_page: 1 }),
    octokit.repos.getContent({ owner, repo, path: ".github/workflows" }),
    octokit.repos.getContent({ owner, repo, path: "package.json" }),
    octokit.repos.getContent({ owner, repo, path: ".github/dependabot.yml" }),
    octokit.repos.getContent({ owner, repo, path: ".github/CODEOWNERS" }),
    octokit.repos.getContent({ owner, repo, path: "SECURITY.md" }),
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

  const workflowFiles =
    workflowsResult.status === "fulfilled" && Array.isArray(workflowsResult.value.data)
      ? workflowsResult.value.data.map((entry) => entry.name).slice(0, 15)
      : [];

  let packageJsonRaw: string | null = null;
  if (packageJsonResult.status === "fulfilled" && !Array.isArray(packageJsonResult.value.data)) {
    const file = packageJsonResult.value.data;
    if (file.type === "file" && "content" in file) {
      packageJsonRaw = decodeBase64Content(file.content);
    }
  }

  const packageSignals = detectPackageSignals(rootEntries, packageJsonRaw);
  const lowerRoots = rootEntries.map((entry) => entry.toLowerCase());

  const languages =
    languagesResult.status === "fulfilled" ? (languagesResult.value.data as Record<string, number>) : {};

  const openPullRequestsEstimate =
    pullsResult.status === "fulfilled" ? pullsResult.value.data.length : null;

  let openPrCount = openPullRequestsEstimate;
  try {
    const { data } = await octokit.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:pr is:open`,
      per_page: 1,
    });
    openPrCount = data.total_count;
  } catch {
    // keep list-based estimate when search is unavailable
  }

  const health: RepoHealthSignals = {
    hasReadme: lowerRoots.some((entry) => entry.startsWith("readme")),
    hasLicense: Boolean(repoData.license?.spdx_id) || lowerRoots.some((entry) => entry.startsWith("license")),
    hasCiWorkflows: workflowFiles.length > 0 || lowerRoots.includes(".github"),
    workflowFiles,
    hasDependabot: dependabotResult.status === "fulfilled",
    hasCodeowners: codeownersResult.status === "fulfilled",
    hasSecurityPolicy:
      securityResult.status === "fulfilled" || lowerRoots.includes("security.md"),
    hasDockerfile: packageSignals.hasDockerfile,
    hasEnvExample: packageSignals.hasEnvExample,
    hasLockfile: packageSignals.hasLockfile,
    hasEslint: packageSignals.hasEslint,
    hasTestsHint: packageSignals.hasTestsHint,
    packageManager: packageSignals.packageManager,
    dependencyCount: packageSignals.dependencyCount,
    devDependencyCount: packageSignals.devDependencyCount,
    npmScripts: packageSignals.npmScripts,
    openPullRequests: openPrCount,
    languages,
    topics: repoData.topics ?? [],
    licenseSpdx: repoData.license?.spdx_id ?? null,
    visibility: repoData.visibility ?? (repoData.private ? "private" : "public"),
    archived: Boolean(repoData.archived),
    isFork: Boolean(repoData.fork),
  };

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
    health,
  };
}
