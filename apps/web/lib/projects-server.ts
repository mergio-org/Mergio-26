import "server-only";
import { cache } from "react";
import { prisma, type Prisma } from "@repo/db";
import { slugify } from "./projects";

/** The one active season. Exactly one is meant to be active; the newest wins if that slips. */
export const activeSeason = cache(async () =>
  prisma.season.findFirst({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
);

/**
 * Repos that count towards a live project: accepted by organizers and not removed.
 * A project is live (listed publicly) only when it is approved and has at least one of these,
 * so it can never go live with zero tracked repos.
 */
export const countedRepo = {
  approval: "APPROVED",
  removedAt: null,
} satisfies Prisma.ProjectRepoWhereInput;

export const liveProject = {
  status: "APPROVED",
  repos: { some: countedRepo },
} satisfies Prisma.ProjectWhereInput;

/** Project admins are users who registered as maintainers (and were not turned down). */
export async function maintainerRegistration(userId: string) {
  return prisma.registration.findFirst({
    where: { userId, role: "MAINTAINER", status: { not: "REJECTED" } },
    select: { id: true, repoUrl: true },
  });
}

// Slugs that would collide with fixed routes under /projects.
const RESERVED_SLUGS = ["new"];

/** A slug from the name that is free in the season: "snowdrift", then "snowdrift-2" and so on. */
export async function uniqueSlug(seasonId: string, name: string) {
  const base = slugify(name);
  const taken = new Set([
    ...RESERVED_SLUGS,
    ...(
      await prisma.project.findMany({
        where: { seasonId, slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((project) => project.slug),
  ]);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Whether a viewer may see a project that is not live: its owner, or an organizer. */
export function canSeeUnpublished(
  project: { ownerId: string },
  viewer: { id: string; isAdmin?: boolean | null } | null | undefined,
) {
  return !!viewer && (viewer.id === project.ownerId || viewer.isAdmin === true);
}
