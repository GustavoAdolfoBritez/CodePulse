import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const authPages = ["/login", "/register"];

/**
 * Edge gatekeeping only checks authentication.
 * Organization/onboarding redirects are handled in Server Components because
 * the JWT `organizationId` claim can lag behind the database and cause
 * ERR_TOO_MANY_REDIRECTS loops when used here.
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
  const isAuthPage = authPages.some((page) => pathname.startsWith(page));

  if (!isAuthenticated && (isDashboardRoute || isOnboardingRoute)) {
    const loginUrl = new URL("/login", request.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/onboarding", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/onboarding"],
};
