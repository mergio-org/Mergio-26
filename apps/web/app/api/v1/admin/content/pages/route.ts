import { getPage } from "@/lib/content-service";
import { json, withRole } from "@/lib/rbac";
import { PAGE_SLUGS } from "@/lib/site-content";

// GET /api/v1/admin/content/pages  Organizers only. Every editable page; updatedAt is null for
// pages still showing their built-in copy.
export const GET = withRole("ORGANIZER", async () =>
  json({ pages: await Promise.all(PAGE_SLUGS.map((slug) => getPage(slug))) }),
);
