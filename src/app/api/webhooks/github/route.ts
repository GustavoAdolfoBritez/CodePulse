import { NextResponse } from "next/server";
import crypto from "node:crypto";

/**
 * Receives GitHub webhook events (push, pull_request, workflow_run, etc.)
 * and — once real logic is added — will enqueue an analysis job for the
 * affected Project. Verifies the HMAC signature GitHub sends.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const rawBody = await request.text();

  if (process.env.GITHUB_WEBHOOK_SECRET) {
    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");

    if (!signature || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = request.headers.get("x-github-event");
  const payload = JSON.parse(rawBody);

  // TODO: map `event`/`payload` to a Project (by repo full_name) and call
  // enqueueAnalysisJob(...) for push/PR events.
  console.log(`[github-webhook] received "${event}" event for ${payload.repository?.full_name}`);

  return NextResponse.json({ received: true });
}
