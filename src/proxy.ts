import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Edge/network gate: only protect dashboard + onboarding behind a session cookie.
 *
 * IMPORTANT:
 * - Never redirect /login|/register → /onboarding here.
 * - Never redirect based on organizationId here.
 * Those checks belong in Server Components using `auth()`, otherwise a stale
 * JWT cookie with a broken Auth.js config creates ERR_TOO_MANY_REDIRECTS.
 */
export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(token?.sub);
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");

  if (!isAuthenticated && (isDashboardRoute || isOnboardingRoute)) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users may visit /login and /register freely.
  // Those pages use `auth()` and redirect only when the server session is valid.
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding"],
};
