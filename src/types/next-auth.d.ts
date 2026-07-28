import type { Role } from "@prisma/client";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string | null;
      role: Role | null;
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    organizationId?: string | null;
    role?: Role | null;
  }
}
