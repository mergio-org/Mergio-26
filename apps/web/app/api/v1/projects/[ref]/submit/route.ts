import { apiUser, failure, json, unauthorized } from "@/lib/api";
import { submitApplication } from "@/lib/project-service";

/** POST /api/v1/projects/{id}/submit — re-checks every repo and sends the application for review. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const user = await apiUser();
  if (!user) return unauthorized();
  // No body is needed, but a JSON content type is still required for writes (CSRF).
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return json(
      { error: { message: "Send the request as application/json." } },
      415,
    );
  }
  const result = await submitApplication(user, (await params).ref);
  return result.ok
    ? json({ project: { ...result.project, status: "SUBMITTED" } })
    : failure(result);
}
