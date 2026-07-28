export function getPostAuthRedirectPath(organizationId: string | null | undefined) {
  return organizationId ? "/dashboard" : "/onboarding";
}
