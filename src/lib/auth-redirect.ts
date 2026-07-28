import { getSafeRedirectPath } from "@/lib/safe-redirect";

export function getPostAuthRedirectPath(organizationId: string | null | undefined) {
  return organizationId ? "/dashboard" : "/onboarding";
}

export function resolveAuthRedirect(
  candidate: string | null | undefined,
  organizationId: string | null | undefined
) {
  return getSafeRedirectPath(candidate, getPostAuthRedirectPath(organizationId));
}
