import { NextResponse } from "next/server";
import crypto from "node:crypto";

function signaturesMatch(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

/**
 * Receives GitHub webhook events (push, pull_request, workflow_run, etc.)
 * and — once real logic is added — will enqueue an analysis job for the
 * affected Project. Always requires HMAC signature verification.
 */
export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 503 }
    );
  }

  const signature = request.headers.get("x-hub-signature-256");
  const rawBody = await request.text();
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  if (!signature || !signaturesMatch(signature, expected)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = request.headers.get("x-github-event");
  let payload: { repository?: { full_name?: string } };
  try {
    payload = JSON.parse(rawBody) as { repository?: { full_name?: string } };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  // TODO: map `event`/`payload` to a Project (by repo full_name) and call
  // enqueueAnalysisJob(...) for push/PR events.
  console.log(`[github-webhook] received "${event}" event for ${payload.repository?.full_name}`);

  return NextResponse.json({ received: true });
}
