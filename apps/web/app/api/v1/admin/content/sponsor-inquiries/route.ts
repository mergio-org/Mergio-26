import { contentJson } from "@/lib/content-api";
import { listSponsorInquiries } from "@/lib/content-service";
import { withRole } from "@/lib/rbac";

// GET /api/v1/admin/content/sponsor-inquiries  Organizers only. The latest 200 "become a sponsor"
// submissions, newest first.
export const GET = withRole("ORGANIZER", async (_request, _context: unknown, { user }) =>
  contentJson(await listSponsorInquiries(user)),
);
