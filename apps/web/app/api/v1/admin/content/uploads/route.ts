import { apiError, json, readJson, withRole } from "@/lib/rbac";
import { presignImageUpload } from "@/lib/uploads";

// POST /api/v1/admin/content/uploads  {"contentType": "image/png", "size": 12345}
// Organizers only. Returns {uploadUrl, publicUrl, key, headers, expiresIn}: PUT the file to
// uploadUrl with `headers` within expiresIn seconds, then save publicUrl in the content.
export const POST = withRole("ORGANIZER", async (request) => {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  const result = presignImageUpload(body.body.contentType, body.body.size);
  return result.ok ? json(result.data, 201) : apiError(result.status, result.message);
});
