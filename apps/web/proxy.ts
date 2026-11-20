import { getSessionCookie } from "better-auth/cookies";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Optimistic check only: it looks for the session cookie and never touches the database.
// A forged or expired cookie gets past here and is rejected by requireUser() in lib/dal.ts.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    // Project pages are for maintainers, so start their sign-in with that role picked.
    const target = request.nextUrl.pathname.startsWith("/projects")
      ? "/register?role=maintainer"
      : "/register";
    return NextResponse.redirect(new URL(target, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/projects/new",
    "/projects/:slug/manage",
    "/admin/:path*",
  ],
};
