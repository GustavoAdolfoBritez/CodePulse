export function buildInsightPrompt(): string {
  return `You are an expert Staff Software Engineer writing a professional B2B
code and API audit report for engineering leadership.

You will be given a snapshot of a GitHub repository (metadata, recent commits,
top-level file listing) or a summary of API performance metrics/logs.

Respond with a structured assessment:
- "score": overall health score 0-100 (100 = excellent, 0 = critical state).
- "severity": INFO | LOW | MEDIUM | HIGH | CRITICAL, based on how urgently a
  human should act.
- "summary": one sentence executive diagnosis.
- "suggestions": professional Markdown audit report. Do NOT mention mocks,
  heuristics, API keys, prompts, or how the analysis was generated.
  Use exactly these sections (in Spanish):

## Resumen ejecutivo
(2-3 sentences)

## Riesgos críticos
Bullet list of items needing immediate attention. If none, say so clearly.

## Vulnerabilidades de seguridad
Bullets about secrets exposure risk, dependency hygiene, auth surface, etc.
Ground claims in the provided data.

## Calidad de código y estilo
Bullets about maintainability, tests, CI/CD, linting, documentation.

## Fortalezas
What the project is doing well.

## Sugerencias
Prioritized, actionable remediation steps.

Avoid generic advice — ground every point in the data you were given.`;
}

export function buildApiAnalysisContext(input: {
  apiUrl: string;
  reachable: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
}): string {
  return `## API Endpoint
- URL: ${input.apiUrl}
- Reachable: ${input.reachable ? "yes" : "no"}
- HTTP status: ${input.httpStatus ?? "n/a"}
- Observed latency: ${input.latencyMs !== null ? `${input.latencyMs} ms` : "n/a"}
${input.errorMessage ? `- Error: ${input.errorMessage}` : ""}`;
}

export function buildRepoAnalysisContext(input: {
  fullName: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  pushedAt: string | null;
  rootEntries: string[];
  commits: Array<{ sha: string; message: string; author: string | null; date: string | null }>;
  health?: {
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
  };
}): string {
  const commitLines = input.commits
    .map((c) => `- ${c.sha} ${c.message}${c.author ? ` (${c.author})` : ""}`)
    .join("\n");

  const health = input.health;
  const languageLines = health
    ? Object.entries(health.languages)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, bytes]) => `- ${name}: ${bytes} bytes`)
        .join("\n")
    : "";

  const healthBlock = health
    ? `
## Engineering health signals
- Visibility: ${health.visibility ?? "unknown"} | Archived: ${health.archived ? "yes" : "no"} | Fork: ${health.isFork ? "yes" : "no"}
- License: ${health.licenseSpdx ?? (health.hasLicense ? "present" : "missing")}
- README: ${health.hasReadme ? "yes" : "no"}
- CI workflows: ${health.hasCiWorkflows ? "yes" : "no"}${health.workflowFiles.length ? ` (${health.workflowFiles.join(", ")})` : ""}
- Dependabot: ${health.hasDependabot ? "yes" : "no"}
- CODEOWNERS: ${health.hasCodeowners ? "yes" : "no"}
- SECURITY.md: ${health.hasSecurityPolicy ? "yes" : "no"}
- Dockerfile/compose: ${health.hasDockerfile ? "yes" : "no"}
- Env sample (.env.example): ${health.hasEnvExample ? "yes" : "no"}
- Lockfile: ${health.hasLockfile ? "yes" : "no"}
- ESLint config: ${health.hasEslint ? "yes" : "no"}
- Tests hint (folder/name): ${health.hasTestsHint ? "yes" : "no"}
- Package manager: ${health.packageManager ?? "n/a"}
- Dependencies: ${health.dependencyCount ?? "n/a"} | DevDependencies: ${health.devDependencyCount ?? "n/a"}
- npm scripts: ${health.npmScripts.length ? health.npmScripts.join(", ") : "n/a"}
- Open pull requests: ${health.openPullRequests ?? "n/a"}
- Topics: ${health.topics.length ? health.topics.join(", ") : "(none)"}

## Languages (by bytes)
${languageLines || "(unavailable)"}
`
    : "";

  return `## Repository
- Name: ${input.fullName}
- Description: ${input.description ?? "(none)"}
- Primary language: ${input.language ?? "unknown"}
- Default branch: ${input.defaultBranch}
- Stars: ${input.stars} | Forks: ${input.forks} | Open issues: ${input.openIssues}
- Last push: ${input.pushedAt ?? "unknown"}
${healthBlock}
## Top-level files/folders
${input.rootEntries.length ? input.rootEntries.map((e) => `- ${e}`).join("\n") : "(empty repository)"}

## Recent commits (most recent first)
${commitLines || "(no commits found)"}`;
}
