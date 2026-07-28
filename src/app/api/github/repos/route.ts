import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isGithubOAuthConfigured, listUserGithubRepos } from "@/lib/github-oauth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGithubOAuthConfigured()) {
    return NextResponse.json({
      configured: false,
      repos: [],
    });
  }

  try {
    const repos = await listUserGithubRepos(session.user.id);
    return NextResponse.json({
      configured: true,
      linked: repos.length > 0,
      repos,
    });
  } catch {
    return NextResponse.json({
      configured: true,
      linked: false,
      repos: [],
      error: "No se pudieron cargar los repositorios de GitHub.",
    });
  }
}
