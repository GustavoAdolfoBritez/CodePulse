import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge gate for authenticated dashboard routes only.
 *
 * Do NOT put /login, /register, or /onboarding in the matcher.
 * Guarding /onboarding with getToken previously caused ERR_TOO_MANY_REDIRECTS:
 * Auth.js on HTTPS sets `__Secure-authjs.session-token`, but getToken defaults
 * secureCookie to false and looked for the wrong cookie name — proxy bounced
 * users to /login while the login page (Node `auth()`) still saw the session
 * and sent them back to /onboarding.
 */
export async function proxy(request: NextRequest) {
  const isHttps = request.nextUrl.protocol === "https:";
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps,
  });

  if (!token?.sub) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
