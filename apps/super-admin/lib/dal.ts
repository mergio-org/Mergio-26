import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { auth } from "./auth";

// Data-access layer for the admin dashboard. Every page and server action that
// needs an authenticated admin must call requireAdmin().

const adminLogins = new Set(
  (process.env.ADMIN_GITHUB_LOGINS ?? "")
    .split(",")
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean),
);

/** Current session, deduplicated per request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/**
 * Returns the signed-in user only if isAdmin === true.
 * Redirects to /login for no session, /unauthorized for non-admins.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = session.user as typeof session.user & {
    githubLogin?: string | null;
    isAdmin: boolean;
  };

  // 1. If session already has isAdmin, allow immediately
  if (user.isAdmin) return user;

  // 2. Check if GitHub login OR email matches ADMIN_GITHUB_LOGINS
  const sessionLogin = user.githubLogin?.toLowerCase();
  const sessionEmail = user.email?.toLowerCase();

  const isMatch =
    (sessionLogin && adminLogins.has(sessionLogin)) ||
    (sessionEmail && adminLogins.has(sessionEmail));

  if (isMatch) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
    user.isAdmin = true;
    return user;
  }

  // 3. Fallback: Check database directly in case user was updated in DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true, githubLogin: true, email: true },
  });

  if (dbUser?.isAdmin) {
    user.isAdmin = true;
    return user;
  }

  const dbLogin = dbUser?.githubLogin?.toLowerCase();
  const dbEmail = dbUser?.email?.toLowerCase();

  if (
    (dbLogin && adminLogins.has(dbLogin)) ||
    (dbEmail && adminLogins.has(dbEmail))
  ) {
    await prisma.user.update({
      where: { id: user.id },
      data: { isAdmin: true },
    });
    user.isAdmin = true;
    return user;
  }

  redirect("/unauthorized");
}
