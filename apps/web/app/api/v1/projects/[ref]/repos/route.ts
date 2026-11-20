import { apiUser, failure, json, readJson, unauthorized } from "@/lib/api";
import { addRepo } from "@/lib/project-service";

/**
 * POST /api/v1/projects/{id}/repos {"url": "https://github.com/owner/repo"} — adds a repo. On an
 * approved project it must pass every check and then waits for an organizer (approval PENDING).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const read = await readJson(request);
  if (!read.ok) return read.response;
  const result = await addRepo(user, (await params).ref, read.body.url);
  return result.ok ? json({ repo: result.repo }, 201) : failure(result);
}
