import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const authPages = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  });

  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(token);
  const hasOrganization = typeof token?.organizationId === "string";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isInviteRoute = pathname.startsWith("/invite");
  const isAuthPage = authPages.some((page) => pathname.startsWith(page));

  if (!isAuthenticated && (isDashboardRoute || isOnboardingRoute)) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isAuthenticated && isDashboardRoute && !hasOrganization) {
    return NextResponse.redirect(new URL("/onboarding", request.nextUrl));
  }

  if (isAuthenticated && isOnboardingRoute && hasOrganization) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  if (isAuthenticated && isAuthPage) {
    const destination = hasOrganization ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(destination, request.nextUrl));
  }

  if (isAuthenticated && !hasOrganization && !isOnboardingRoute && !isInviteRoute && isDashboardRoute) {
    return NextResponse.redirect(new URL("/onboarding", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/onboarding", "/invite/:path*"],
};
