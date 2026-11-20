import { prisma } from "@repo/db";
import {
  apiUser,
  failure,
  json,
  projectJson,
  readJson,
  unauthorized,
} from "@/lib/api";
import { normaliseProjectBody } from "@/lib/projects";
import { saveApplication } from "@/lib/project-service";
import { activeSeason, countedRepo, liveProject } from "@/lib/projects-server";

/** GET /api/v1/projects?tag=Rust — the live projects of the active season. */
export async function GET(request: Request) {
  const season = await activeSeason();
  if (!season) return json({ season: null, projects: [] });
  const tag = new URL(request.url).searchParams.get("tag")?.trim();
  const projects = await prisma.project.findMany({
    where: {
      seasonId: season.id,
      ...liveProject,
      ...(tag ? { techStack: { has: tag } } : {}),
    },
    orderBy: { approvedAt: "asc" },
    include: { repos: { where: countedRepo, orderBy: { createdAt: "asc" } } },
  });
  return json({
    season: { slug: season.slug, name: season.name },
    projects: projects.map((project) => projectJson(project, false)),
  });
}

/** POST /api/v1/projects — creates a draft application (maintainers only). */
export async function POST(request: Request) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const read = await readJson(request);
  if (!read.ok) return read.response;
  const result = await saveApplication(
    user,
    null,
    normaliseProjectBody(read.body),
  );
  if (!result.ok) return failure(result);
  return json(
    { project: result.project, repoProblems: result.repoProblems },
    201,
  );
}
