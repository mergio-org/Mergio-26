"use server";

import type { ProjectStatus } from "@repo/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import { PROJECT_STATUSES } from "@/lib/projects";
import {
  addReviewNote,
  changeProjectStatus,
  StatusChangeError,
} from "@/lib/project-status";
import { decideRepo } from "@/lib/project-service";

export type ReviewState = { error?: string; done?: string };

/**
 * An organizer's decision on a project: a status change (with an optional internal note and,
 * where needed, a public reason) or a note on its own. `seenStatus` is the status the organizer
 * was looking at, so two organizers acting at once can't overwrite each other.
 */
export async function reviewProjectAction(
  projectId: string,
  seenStatus: ProjectStatus,
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await getSession();
  if (!session?.user.isAdmin)
    return { error: "Only organizers can review projects." };

  const decision = formData.get("decision")?.toString() ?? "";
  const internalNote = formData.get("internalNote")?.toString() ?? "";
  const publicReason = formData.get("publicReason")?.toString() ?? "";
  if (internalNote.length > 4000 || publicReason.length > 4000) {
    return { error: "Keep notes under 4000 characters." };
  }

  try {
    if (decision === "NOTE") {
      await addReviewNote(projectId, session.user.id, internalNote);
    } else if ((PROJECT_STATUSES as readonly string[]).includes(decision)) {
      await changeProjectStatus({
        projectId,
        from: seenStatus,
        to: decision as ProjectStatus,
        actorId: session.user.id,
        internalNote,
        publicReason,
      });
    } else {
      return { error: "Pick what to do." };
    }
  } catch (error) {
    if (error instanceof StatusChangeError) return { error: error.message };
    throw error;
  }

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath("/projects", "layout");
  return {
    done:
      decision === "NOTE"
        ? "Note added."
        : "Status updated. The project admin has been emailed.",
  };
}

/**
 * Accepts or rejects a repo the project admin added after approval. On success it returns to the
 * review page with a confirmation, since the decided repo leaves the "Repo requests" list.
 */
export async function decideRepoAction(
  projectId: string,
  repoId: string,
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const session = await getSession();
  if (!session) return { error: "Your session expired. Sign in again." };
  const accept = formData.get("decision") === "accept";
  const note = formData.get("reason")?.toString() ?? "";
  if (note.length > 4000)
    return { error: "Keep the reason under 4000 characters." };
  const result = await decideRepo(session.user, repoId, accept, note);
  if (!result.ok) return { error: result.message };
  revalidatePath("/admin/projects", "layout");
  revalidatePath("/projects", "layout");
  redirect(
    `/admin/projects/${projectId}?repo=${accept ? "accepted" : "rejected"}`,
  );
}
