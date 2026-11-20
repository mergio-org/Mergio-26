import "server-only";
import { headers } from "next/headers";
import { auth } from "./auth";
import type { Failure } from "./project-service";

// Helpers for the /api/v1 route handlers. They authenticate with the same Better Auth session
// cookie as the site (SameSite=Lax, so other sites can't send it with a POST), and every write
// also requires a JSON body, which a cross-site HTML form can't send.

/** JSON response. BigInts (GitHub repo ids) are sent as strings. */
export function json(data: unknown, status = 200) {
  return new Response(
    JSON.stringify(data, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}

export const apiError = (
  status: number,
  message: string,
  extra?: Record<string, unknown>,
) => json({ error: { message, ...extra } }, status);

/** A service failure as an API error, with field errors and GitHub problems when there are any. */
export const failure = (result: Failure) =>
  apiError(result.status, result.message, {
    ...(result.errors ? { fields: result.errors } : {}),
    ...(result.repoProblems ? { repoProblems: result.repoProblems } : {}),
  });

/** The signed-in user, or null. */
export async function apiUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export const unauthorized = () => apiError(401, "Sign in first.");

/** Reads a JSON object body; anything else is a 415 or 400 response. */
export async function readJson(
  request: Request,
): Promise<
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; response: Response }
> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return {
      ok: false,
      response: apiError(415, "Send the body as application/json."),
    };
  }
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return {
        ok: false,
        response: apiError(400, "The body must be a JSON object."),
      };
    }
    return { ok: true, body: body as Record<string, unknown> };
  } catch {
    return {
      ok: false,
      response: apiError(400, "The body is not valid JSON."),
    };
  }
}

type RepoRow = {
  id: string;
  githubRepoId: bigint;
  owner: string;
  name: string;
  approval: string;
  trackingStatus: string;
  validation: unknown;
  validatedAt: Date | null;
};

/** A project as the API returns it. `full` adds what only its owner and organizers see. */
export function projectJson(
  project: {
    id: string;
    slug: string;
    name: string;
    description: string;
    techStack: string[];
    difficultyEasy: number;
    difficultyMedium: number;
    difficultyHard: number;
    logoUrl: string | null;
    discordChannel: string | null;
    contributingUrl: string | null;
    expectedMentors: number;
    license: string;
    status: string;
    publicReason: string | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    repos: RepoRow[];
  },
  full: boolean,
) {
  const repos = full
    ? project.repos
    : project.repos.filter((repo) => repo.approval === "APPROVED");
  return {
    id: project.id,
    slug: project.slug,
    name: project.name,
    description: project.description,
    techStack: project.techStack,
    difficulty: {
      beginner: project.difficultyEasy,
      intermediate: project.difficultyMedium,
      advanced: project.difficultyHard,
    },
    logoUrl: project.logoUrl,
    discordChannel: project.discordChannel,
    contributingUrl: project.contributingUrl,
    expectedMentors: project.expectedMentors,
    license: project.license,
    approvedAt: project.approvedAt,
    repos: repos.map((repo) => ({
      id: repo.id,
      githubRepoId: repo.githubRepoId,
      fullName: `${repo.owner}/${repo.name}`,
      url: `https://github.com/${repo.owner}/${repo.name}`,
      ...(full
        ? {
            approval: repo.approval,
            trackingStatus: repo.trackingStatus,
            validation: repo.validation,
            validatedAt: repo.validatedAt,
          }
        : {}),
    })),
    ...(full
      ? {
          status: project.status,
          publicReason: project.publicReason,
          submittedAt: project.submittedAt,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        }
      : {}),
  };
}
