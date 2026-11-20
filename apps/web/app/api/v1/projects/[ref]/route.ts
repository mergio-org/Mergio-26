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
import { normaliseProjectBody, repoUrl } from "@/lib/projects";
import { saveApplication, updateApprovedDetails } from "@/lib/project-service";
import { activeSeason, canSeeUnpublished } from "@/lib/projects-server";

type Context = { params: Promise<{ ref: string }> };

/** GET /api/v1/projects/{slug} — a live project, or any of yours (organizers see every one). */
export async function GET(_request: Request, { params }: Context) {
  const { ref: slug } = await params;
  const season = await activeSeason();
  const project = season
    ? await prisma.project.findUnique({
        where: { seasonId_slug: { seasonId: season.id, slug } },
        include: {
          repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
        },
      })
    : null;
  if (!project) return apiError(404, "Project not found.");
  const live =
    project.status === "APPROVED" &&
    project.repos.some((repo) => repo.approval === "APPROVED");
  const privileged = canSeeUnpublished(project, await apiUser());
  if (!live && !privileged) return apiError(404, "Project not found.");
  return json({ project: projectJson(project, privileged) });
}

/**
 * PATCH /api/v1/projects/{id} — changes your application. Send only the fields to change.
 * While it is a draft or has changes requested, every field can change; once approved, only
 * `description` and `techStack`.
 */
export async function PATCH(request: Request, { params }: Context) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const read = await readJson(request);
  if (!read.ok) return read.response;
  const { ref: id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!project || project.ownerId !== user.id)
    return apiError(404, "Project not found.");

  if (project.status === "APPROVED") {
    const allowed = new Set(["description", "techStack"]);
    const others = Object.keys(read.body).filter((key) => !allowed.has(key));
    if (others.length) {
      return apiError(
        409,
        `Approved projects can only change description and techStack (not ${others.join(", ")}).`,
      );
    }
    const body = normaliseProjectBody({
      description: project.description,
      techStack: project.techStack.join(","),
      ...read.body,
    });
    const result = await updateApprovedDetails(user, id, body);
    return result.ok ? json({ project: result.project }) : failure(result);
  }

  // The stored application in the form's shape, with the changes laid over it.
  const current = {
    name: project.name,
    description: project.description,
    techStack: project.techStack.join(","),
    difficultyEasy: project.difficultyEasy,
    difficultyMedium: project.difficultyMedium,
    difficultyHard: project.difficultyHard,
    repos: project.repos.map((repo) => repoUrl(repo)).join("\n"),
    logoUrl: project.logoUrl ?? "",
    discordChannel: project.discordChannel ?? "",
    contributingUrl: project.contributingUrl ?? "",
    expectedMentors: project.expectedMentors,
    license: project.license,
  };
  const result = await saveApplication(
    user,
    id,
    normaliseProjectBody({ ...current, ...read.body }),
  );
  return result.ok
    ? json({ project: result.project, repoProblems: result.repoProblems })
    : failure(result);
}
