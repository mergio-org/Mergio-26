import { contentJson, publishContent } from "@/lib/content-api";
import { importDefaults } from "@/lib/content-service";
import { apiError, withRole } from "@/lib/rbac";
import { parseKind } from "@/lib/site-content";

type Context = RouteContext<"/api/v1/admin/content/[kind]/import">;

// POST /api/v1/admin/content/{kind}/import  Copies the built-in copy into the database so it
// can be edited. 409 if the kind already has items.
export const POST = withRole("ORGANIZER", async (_request, context: Context, { user }) => {
  const kind = parseKind((await context.params).kind);
  if (!kind) return apiError(404, "Unknown content kind.");
  return contentJson(publishContent(await importDefaults(user, kind)), 201);
});
