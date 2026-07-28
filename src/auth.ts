import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          include: {
            memberships: {
              include: { organization: true },
              orderBy: { createdAt: "asc" },
            },
          },
        });

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);
        if (!passwordMatches) {
          return null;
        }

        if (!user.currentOrganizationId && user.memberships[0]) {
          await prisma.user.update({
            where: { id: user.id },
            data: { currentOrganizationId: user.memberships[0].organizationId },
          });
        }

        return user;
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token }) {
      if (!token.sub) {
        return token;
      }

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        include: {
          memberships: {
            include: { organization: true },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!user) {
        return token;
      }

      const activeMembership =
        user.memberships.find((membership) => membership.organizationId === user.currentOrganizationId) ??
        user.memberships[0];

      token.name = user.name;
      token.email = user.email;
      token.organizationId = activeMembership?.organizationId ?? null;
      token.role = activeMembership?.role ?? user.role;

      if (activeMembership && user.currentOrganizationId !== activeMembership.organizationId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { currentOrganizationId: activeMembership.organizationId },
        });
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.organizationId =
          typeof token.organizationId === "string" ? token.organizationId : null;
        session.user.role = typeof token.role === "string" ? token.role : null;
      }
      return session;
    },
  },
});
