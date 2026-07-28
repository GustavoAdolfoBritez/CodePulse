import { prisma } from "@/lib/prisma";
import { createGithubClient } from "@/lib/github";

export function isGithubOAuthConfigured() {
  return Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
}

export async function getUserGithubAccessToken(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "github" },
    select: { access_token: true },
  });

  return account?.access_token ?? null;
}

export interface GithubRepoSummary {
  id: number;
  fullName: string;
  htmlUrl: string;
  description: string | null;
  private: boolean;
  language: string | null;
  updatedAt: string | null;
}

export async function listUserGithubRepos(userId: string): Promise<GithubRepoSummary[]> {
  const accessToken = await getUserGithubAccessToken(userId);
  if (!accessToken) {
    return [];
  }

  const octokit = createGithubClient(accessToken);
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: "updated",
    direction: "desc",
  });

  return repos.map((repo) => ({
    id: repo.id,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    private: repo.private,
    language: repo.language,
    updatedAt: repo.updated_at,
  }));
}
