"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";
import type { ProjectFormState } from "@/lib/projects";
import {
  addRepo,
  copyFromLastSeason,
  removeRepo,
  saveApplication,
  submitApplication,
  updateApprovedDetails,
  type Failure,
} from "@/lib/project-service";

// Form adapters over lib/project-service.ts, which holds the rules (the /api/v1 routes use it too).

const SESSION_EXPIRED: ProjectFormState = {
  errors: { form: "Your session expired. Sign in with GitHub again." },
};

function readApplication(formData: FormData) {
  const text = (name: string) => formData.get(name)?.toString() ?? "";
  return {
    name: text("name"),
    description: text("description"),
    techStack: text("techStack"),
    difficultyEasy: text("difficultyEasy"),
    difficultyMedium: text("difficultyMedium"),
    difficultyHard: text("difficultyHard"),
    repos: text("repos"),
    logoUrl: text("logoUrl"),
    discordChannel: text("discordChannel"),
    contributingUrl: text("contributingUrl"),
    expectedMentors: text("expectedMentors"),
    license: text("license"),
  };
}

/** A failure as form state: field errors under their fields, anything else at the top. */
const asFormState = (failure: Failure): ProjectFormState => ({
  errors: failure.errors ?? { form: failure.message },
  repoProblems: failure.repoProblems,
});

function refresh(slug: string) {
  revalidatePath(`/projects/${slug}`);
  revalidatePath(`/projects/${slug}/manage`);
  revalidatePath("/projects");
}

/** Creates a draft (projectId null) or saves the whole application. */
export async function saveProjectAction(
  projectId: string | null,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await getSession();
  if (!session) return SESSION_EXPIRED;
  const result = await saveApplication(
    session.user,
    projectId,
    readApplication(formData),
  );
  if (!result.ok) return asFormState(result);
  if (result.created)
    redirect(`/projects/${result.project.slug}/manage?saved=1`);
  refresh(result.project.slug);
  return { saved: true, repoProblems: result.repoProblems };
}

/** Sends the application to the reviewers after re-checking every repo. */
export async function submitProjectAction(
  projectId: string,
): Promise<ProjectFormState> {
  const session = await getSession();
  if (!session) return SESSION_EXPIRED;
  const result = await submitApplication(session.user, projectId);
  if (!result.ok) {
    if (result.repoProblems) revalidatePath("/projects", "layout");
    return {
      errors: { form: result.message },
      repoProblems: result.repoProblems,
    };
  }
  refresh(result.project.slug);
  redirect(`/projects/${result.project.slug}/manage?submitted=1`);
}

/** After approval: the description and tech stack. */
export async function saveApprovedDetailsAction(
  projectId: string,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const session = await getSession();
  if (!session) return SESSION_EXPIRED;
  const result = await updateApprovedDetails(session.user, projectId, {
    description: formData.get("description")?.toString() ?? "",
    techStack: formData.get("techStack")?.toString() ?? "",
  });
  if (!result.ok) return asFormState(result);
  refresh(result.project.slug);
  return { saved: true };
}

export type RepoActionState = {
  error?: string;
  done?: string;
  repoProblems?: Record<string, string[]>;
};

export async function addRepoAction(
  projectId: string,
  _prev: RepoActionState,
  formData: FormData,
): Promise<RepoActionState> {
  const session = await getSession();
  if (!session)
    return { error: "Your session expired. Sign in with GitHub again." };
  const result = await addRepo(
    session.user,
    projectId,
    formData.get("repo")?.toString() ?? "",
  );
  if (!result.ok) {
    return {
      error: result.errors?.repos ?? result.message,
      repoProblems: result.repoProblems,
    };
  }
  revalidatePath("/projects", "layout");
  revalidatePath("/admin/projects", "layout");
  return {
    done:
      result.repo.approval === "PENDING"
        ? `${result.repo.owner}/${result.repo.name} was added and is waiting for an organizer to approve it.`
        : `${result.repo.owner}/${result.repo.name} was added.`,
  };
}

export async function removeRepoAction(
  projectId: string,
  repoId: string,
): Promise<RepoActionState> {
  const session = await getSession();
  if (!session)
    return { error: "Your session expired. Sign in with GitHub again." };
  const result = await removeRepo(session.user, projectId, repoId);
  if (!result.ok) return { error: result.message };
  revalidatePath("/projects", "layout");
  revalidatePath("/admin/projects", "layout");
  return { done: "Repo removed." };
}

/** Starts this season's application from a project of an earlier season. */
export async function copyProjectAction(
  sourceId: string,
): Promise<RepoActionState> {
  const session = await getSession();
  if (!session)
    return { error: "Your session expired. Sign in with GitHub again." };
  const result = await copyFromLastSeason(session.user, sourceId);
  if (!result.ok) return { error: result.message };
  redirect(`/projects/${result.project.slug}/manage?copied=1`);
}
