import "server-only";
import { prisma } from "@repo/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

// Set in production (".mergio.in") so the session cookie set by apps/web is
// readable here on admin.mergio.in.
const cookieDomain = process.env.AUTH_COOKIE_DOMAIN || undefined;

// The super-admin app shares the same Better Auth instance as apps/web so
// that the same session cookie is accepted. It does NOT expose a sign-in
// flow of its own — admins sign in via apps/web first.
export const auth = betterAuth({
  // Must point to apps/web so the session cookie domain/path match.
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      scope: ["read:user", "user:email"],
    },
  },

  user: {
    additionalFields: {
      githubLogin: { type: "string", required: false, input: false },
      isAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },

  advanced: {
    crossSubDomainCookies: cookieDomain
      ? { enabled: true, domain: cookieDomain }
      : { enabled: false },
  },

  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
