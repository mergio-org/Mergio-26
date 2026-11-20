import { prisma } from "@repo/db";
import {
  apiError,
  apiUser,
  failure,
  json,
  projectJson,
  readJson,
  unauthorized,
} from "@/lib/api";
import { TRANSITIONS } from "@/lib/project-status";
import { reviewDecision } from "@/lib/project-service";

type Context = { params: Promise<{ id: string }> };

/** GET /api/v1/admin/projects/{id}/review — the application, its review history and the allowed decisions. */
export async function GET(_request: Request, { params }: Context) {
  const user = await apiUser();
  if (!user) return unauthorized();
  if (!user.isAdmin)
    return apiError(403, "Only organizers can review projects.");
  const project = await prisma.project.findUnique({
    where: { id: (await params).id },
    include: {
      repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
      owner: {
        select: { id: true, name: true, githubLogin: true, email: true },
      },
      reviews: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { githubLogin: true, name: true } } },
      },
    },
  });
  if (!project) return apiError(404, "Project not found.");
  return json({
    project: { ...projectJson(project, true), owner: project.owner },
    decisions: [
      ...TRANSITIONS[project.status].filter((to) => to !== "SUBMITTED"),
      "NOTE",
    ],
    history: project.reviews.map((review) => ({
      at: review.createdAt,
      actor: review.actor?.githubLogin ?? review.actor?.name ?? null,
      fromStatus: review.fromStatus,
      toStatus: review.toStatus,
      internalNote: review.internalNote,
      publicReason: review.publicReason,
    })),
  });
}

/**
 * POST /api/v1/admin/projects/{id}/review
 * {"decision": "APPROVED" | "UNDER_REVIEW" | "CHANGES_REQUESTED" | "REJECTED" | "NOTE",
 *  "seenStatus"?: "...", "publicReason"?: "...", "internalNote"?: "..."}
 * Send seenStatus (the status you reviewed) so a decision made meanwhile isn't overwritten.
 */
export async function POST(request: Request, { params }: Context) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const read = await readJson(request);
  if (!read.ok) return read.response;
  const id = (await params).id;
  const result = await reviewDecision(user, id, read.body);
  if (!result.ok) return failure(result);
  const project = await prisma.project.findUnique({
    where: { id },
    select: { status: true },
  });
  return json({ status: project?.status });
}
