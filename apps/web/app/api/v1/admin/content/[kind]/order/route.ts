import { contentJson, publishContent } from "@/lib/content-api";
import { reorderItems } from "@/lib/content-service";
import { apiError, readJson, withRole } from "@/lib/rbac";
import { parseKind } from "@/lib/site-content";

type Context = RouteContext<"/api/v1/admin/content/[kind]/order">;

// PUT /api/v1/admin/content/{kind}/order  {"ids": [...]}  Every item of the kind, in the new order.
export const PUT = withRole("ORGANIZER", async (request, context: Context, { user }) => {
  const kind = parseKind((await context.params).kind);
  if (!kind) return apiError(404, "Unknown content kind.");
  const body = await readJson(request);
  if (!body.ok) return body.response;
  return contentJson(publishContent(await reorderItems(user, kind, body.body.ids)));
});
