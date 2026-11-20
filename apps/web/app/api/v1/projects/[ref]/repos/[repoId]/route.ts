import { apiUser, failure, unauthorized } from "@/lib/api";
import { removeRepo } from "@/lib/project-service";

/**
 * DELETE /api/v1/projects/{id}/repos/{repoId} — removes a repo. On an approved project future
 * scoring stops but earned points stay; the last accepted repo can't be removed.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ref: string; repoId: string }> },
) {
  const user = await apiUser();
  if (!user) return unauthorized();
  const { ref, repoId } = await params;
  const result = await removeRepo(user, ref, repoId);
  return result.ok ? new Response(null, { status: 204 }) : failure(result);
}
