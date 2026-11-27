import { contentJson, publishContent } from "@/lib/content-api";
import { deleteItem, getItem, updateItem } from "@/lib/content-service";
import { apiError, readJson, withRole } from "@/lib/rbac";
import { parseKind } from "@/lib/site-content";

type Context = RouteContext<"/api/v1/admin/content/[kind]/[id]">;

async function params(context: Context) {
  const { kind, id } = await context.params;
  return { kind: parseKind(kind), id };
}

// GET /api/v1/admin/content/{kind}/{id}  Organizers only.
export const GET = withRole("ORGANIZER", async (_request, context: Context) => {
  const { kind, id } = await params(context);
  if (!kind) return apiError(404, "Unknown content kind.");
  return contentJson(await getItem(kind, id));
});

// PATCH /api/v1/admin/content/{kind}/{id}  {...fields}  Fields left out keep their value.
export const PATCH = withRole("ORGANIZER", async (request, context: Context, { user }) => {
  const { kind, id } = await params(context);
  if (!kind) return apiError(404, "Unknown content kind.");
  const body = await readJson(request);
  if (!body.ok) return body.response;
  return contentJson(publishContent(await updateItem(user, kind, id, body.body)));
});

// DELETE /api/v1/admin/content/{kind}/{id}
export const DELETE = withRole("ORGANIZER", async (_request, context: Context, { user }) => {
  const { kind, id } = await params(context);
  if (!kind) return apiError(404, "Unknown content kind.");
  return contentJson(publishContent(await deleteItem(user, kind, id)));
});
