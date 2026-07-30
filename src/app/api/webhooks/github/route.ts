import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { matchesGithubFullName } from "@/lib/github-repo-match";
import { getUserGithubAccessToken } from "@/lib/github-oauth";
import { enqueueOrRunAnalysis } from "@/server/analysis/enqueue-or-run";

export const maxDuration = 60;

function signaturesMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function expectedSignature(secret: string, rawBody: string) {
  return "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

type GithubWebhookPayload = {
  action?: string;
  ref?: string;
  after?: string;
  pull_request?: {
    number?: number;
    head?: { sha?: string; ref?: string };
  };
  repository?: {
    full_name?: string;
    html_url?: string;
    default_branch?: string;
  };
};

function shouldAnalyzeEvent(event: string | null, payload: GithubWebhookPayload): boolean {
  if (event === "ping") {
    return false;
  }
  if (event === "push") {
    return Boolean(payload.ref) && payload.after !== "0000000000000000000000000000000000000000";
  }
  if (event === "pull_request") {
    return ["opened", "reopened", "synchronize", "ready_for_review"].includes(payload.action ?? "");
  }
  return false;
}

async function resolveGithubTokenForProject(organizationId: string) {
  if (process.env.GITHUB_TOKEN?.trim()) {
    return process.env.GITHUB_TOKEN.trim();
  }

  const memberships = await prisma.organizationMembership.findMany({
    where: { organizationId },
    select: { userId: true },
    take: 25,
    orderBy: { createdAt: "asc" },
  });

  for (const membership of memberships) {
    const token = await getUserGithubAccessToken(membership.userId);
    if (token) {
      return token;
    }
  }

  return null;
}

/**
 * Verifies GitHub HMAC using either the platform env secret or an organization
 * webhookApiKey (the value users paste into GitHub from Settings).
 */
function resolveAuthorizedOrganizationIds(args: {
  signature: string;
  rawBody: string;
  orgSecrets: Array<{ organizationId: string; secret: string }>;
}): Set<string> | "platform" | null {
  const platformSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  if (platformSecret) {
    const expected = expectedSignature(platformSecret, args.rawBody);
    if (signaturesMatch(args.signature, expected)) {
      return "platform";
    }
  }

  const authorized = new Set<string>();
  for (const entry of args.orgSecrets) {
    const expected = expectedSignature(entry.secret, args.rawBody);
    if (signaturesMatch(args.signature, expected)) {
      authorized.add(entry.organizationId);
    }
  }

  return authorized.size > 0 ? authorized : null;
}

/**
 * Receives GitHub webhook events and enqueues (or runs inline) analysis for
 * matching CodePulse projects whose organization secret (or platform secret)
 * validates the delivery.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const rawBody = await request.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  let payload: GithubWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as GithubWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const event = request.headers.get("x-github-event");
  const fullName = payload.repository?.full_name;
  console.log(`[github-webhook] received "${event}" event for ${fullName ?? "unknown"}`);

  const candidates = fullName
    ? await prisma.project.findMany({
        where: {
          sourceType: "GITHUB_REPO",
          githubRepoUrl: { not: null },
        },
        select: {
          id: true,
          githubRepoUrl: true,
          organizationId: true,
          organization: { select: { webhookApiKey: true } },
        },
      })
    : [];

  const matches = candidates.filter((project) =>
    matchesGithubFullName(project.githubRepoUrl, fullName)
  );

  const orgSecrets = Array.from(
    new Map(
      matches
        .filter((project) => project.organization.webhookApiKey)
        .map((project) => [
          project.organizationId,
          {
            organizationId: project.organizationId,
            secret: project.organization.webhookApiKey!,
          },
        ])
    ).values()
  );

  // Ping may arrive before the repo is connected — still accept platform secret,
  // or any org secret present in the delivery if we can match the repo later.
  if (matches.length === 0 && event === "ping") {
    const platformSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
    if (platformSecret) {
      const expected = expectedSignature(platformSecret, rawBody);
      if (signaturesMatch(signature, expected)) {
        return NextResponse.json({ ok: true, pong: true });
      }
    }
    // Also accept if at least one org key in the system matches (rare edge).
    const orgsWithKeys = await prisma.organization.findMany({
      where: { webhookApiKey: { not: null } },
      select: { id: true, webhookApiKey: true },
      take: 200,
    });
    for (const org of orgsWithKeys) {
      if (!org.webhookApiKey) continue;
      const expected = expectedSignature(org.webhookApiKey, rawBody);
      if (signaturesMatch(signature, expected)) {
        return NextResponse.json({ ok: true, pong: true });
      }
    }
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const authorized = resolveAuthorizedOrganizationIds({
    signature,
    rawBody,
    orgSecrets,
  });

  if (!authorized) {
    return NextResponse.json(
      {
        error:
          "Invalid signature. En Settings de CodePulse copiá el Secret de tu organización (no el nombre de una variable de entorno).",
      },
      { status: 401 }
    );
  }

  if (event === "ping") {
    return NextResponse.json({ ok: true, pong: true });
  }

  if (!fullName || !shouldAnalyzeEvent(event, payload)) {
    return NextResponse.json({ received: true, queued: 0, skipped: true });
  }

  const authorizedMatches =
    authorized === "platform"
      ? matches
      : matches.filter((project) => authorized.has(project.organizationId));

  if (authorizedMatches.length === 0) {
    return NextResponse.json({ received: true, queued: 0, matched: false });
  }

  const sourceRef =
    payload.pull_request?.head?.sha ??
    payload.after ??
    payload.pull_request?.head?.ref ??
    payload.ref ??
    fullName;

  const results = await Promise.allSettled(
    authorizedMatches.map(async (project) => {
      const githubAccessToken = await resolveGithubTokenForProject(project.organizationId);
      await enqueueOrRunAnalysis({
        projectId: project.id,
        sourceType: "GITHUB_REPO",
        target: project.githubRepoUrl!,
        triggeredBy: `github-webhook:${event}`,
        sourceRef,
        githubAccessToken: githubAccessToken ?? undefined,
      });
      return project.id;
    })
  );

  const queued = results.filter((result) => result.status === "fulfilled").length;
  const failed = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason));

  if (failed.length) {
    console.error("[github-webhook] some analyses failed to start", failed);
  }

  return NextResponse.json({
    received: true,
    matched: true,
    queued,
    failed: failed.length,
    projectIds: results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
      .map((result) => result.value),
  });
}
