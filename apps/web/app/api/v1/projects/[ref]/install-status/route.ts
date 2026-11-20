import { apiUser, failure, json } from "@/lib/api";
import { installStatus } from "@/lib/project-service";

/**
 * GET /api/v1/projects/{id}/install-status — whether the Mergio GitHub App tracks each accepted
 * repo: "active" (all), "partial" or "not_installed". F-06's installation webhooks keep it current.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const result = await installStatus(await apiUser(), (await params).ref);
  if (!result.ok) return failure(result);
  return json({ tracking: result.tracking, repos: result.repos });
}
