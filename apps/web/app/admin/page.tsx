import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/dal";

// The organizer console overview arrives with F-11; until then /admin opens the review queue.
export default async function AdminPage() {
  await requireAdmin();
  redirect("/admin/projects");
}
