import { contentJson } from "@/lib/content-api";
import { createSponsorInquiry } from "@/lib/content-service";
import { readJson } from "@/lib/rbac";

// POST /api/v1/sponsor-inquiries  {"name", "email", "organization", "message"}
// Public: the "Become a sponsor" form on /sponsors. 201 {id}; 400 with `fields`; 429 on repeats.
export async function POST(request: Request) {
  const body = await readJson(request);
  if (!body.ok) return body.response;
  return contentJson(await createSponsorInquiry(body.body), 201);
}
