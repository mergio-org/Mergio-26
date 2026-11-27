import { contentJson, publishContent } from "@/lib/content-api";
import { getPage, resetPage, savePage } from "@/lib/content-service";
import { apiError, json, readJson, withRole } from "@/lib/rbac";
import { parsePageSlug } from "@/lib/site-content";

type Context = RouteContext<"/api/v1/admin/content/pages/[slug]">;

// slug: about | code-of-conduct | privacy | terms

// GET /api/v1/admin/content/pages/{slug}
export const GET = withRole("ORGANIZER", async (_request, context: Context) => {
  const slug = parsePageSlug((await context.params).slug);
  if (!slug) return apiError(404, "Unknown page.");
  return json(await getPage(slug));
});

// PUT /api/v1/admin/content/pages/{slug}  {"title", "description", "body"}  body is markdown.
export const PUT = withRole("ORGANIZER", async (request, context: Context, { user }) => {
  const slug = parsePageSlug((await context.params).slug);
  if (!slug) return apiError(404, "Unknown page.");
  const body = await readJson(request);
  if (!body.ok) return body.response;
  return contentJson(publishContent(await savePage(user, slug, body.body)));
});

// DELETE /api/v1/admin/content/pages/{slug}  Goes back to the built-in copy.
export const DELETE = withRole("ORGANIZER", async (_request, context: Context, { user }) => {
  const slug = parsePageSlug((await context.params).slug);
  if (!slug) return apiError(404, "Unknown page.");
  return contentJson(publishContent(await resetPage(user, slug)));
});
