import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { auth } from "./auth";

// Data access layer. This is the real permission check: proxy.ts only does a cheap
// cookie check, so every page and action that needs a user must come through here.

/** The current session, or null. Deduplicated within one request. */
export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

/** The signed-in user. Redirects to the registration page (where sign-in starts) if there is none. */
export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/register");
  return session.user;
}

/** The signed-in organizer. Anyone else gets a 404, so admin pages don't reveal that they exist. */
export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) notFound();
  return user;
}
