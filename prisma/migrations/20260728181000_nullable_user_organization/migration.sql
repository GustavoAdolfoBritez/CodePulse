-- Allow users to exist before onboarding creates their organization.
ALTER TABLE "users" ALTER COLUMN "organizationId" DROP NOT NULL;

-- Align FK with Prisma schema: home org can be cleared on org delete.
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_organizationId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
