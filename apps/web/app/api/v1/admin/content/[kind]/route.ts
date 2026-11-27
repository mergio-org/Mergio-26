import { contentJson, publishContent } from "@/lib/content-api";
import { createItem, listItems } from "@/lib/content-service";
import { apiError, json, readJson, withRole } from "@/lib/rbac";
import { parseKind } from "@/lib/site-content";

type Context = RouteContext<"/api/v1/admin/content/[kind]">;

// GET /api/v1/admin/content/{kind}   kind: faq | timeline | sponsors | team | stats
// Organizers only. Lists the stored items in display order.
export const GET = withRole("ORGANIZER", async (_request, context: Context) => {
  const kind = parseKind((await context.params).kind);
  if (!kind) return apiError(404, "Unknown content kind.");
  return json({ items: await listItems(kind) });
});

// POST /api/v1/admin/content/{kind}  {...fields}  Adds an item at the end. 201 with the item.
export const POST = withRole("ORGANIZER", async (request, context: Context, { user }) => {
  const kind = parseKind((await context.params).kind);
  if (!kind) return apiError(404, "Unknown content kind.");
  const body = await readJson(request);
  if (!body.ok) return body.response;
  return contentJson(publishContent(await createItem(user, kind, body.body)), 201);
});
