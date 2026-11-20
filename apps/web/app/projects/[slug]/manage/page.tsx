import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/projects/status-badge";
import { requireUser } from "@/lib/dal";
import { EDITABLE_STATUSES, repoUrl } from "@/lib/projects";
import { allReposPassed, RepoChecks } from "@/components/projects/repo-checks";
import { githubAppInstallUrl } from "@/lib/project-status";
import { activeSeason } from "@/lib/projects-server";
import {
  addRepoAction,
  removeRepoAction,
  saveApprovedDetailsAction,
  saveProjectAction,
  submitProjectAction,
} from "../../actions";
import {
  AddRepoForm,
  ApprovedDetailsForm,
  RemoveRepoButton,
} from "../../approved-tools";
import { ProjectForm } from "../../project-form";
import { SubmitPanel } from "../../submit-panel";

export const metadata: Metadata = {
  title: "Manage project — Mergio",
  robots: { index: false, follow: false },
};

export default async function ManageProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    saved?: string;
    submitted?: string;
    copied?: string;
  }>;
}) {
  const user = await requireUser();
  const [{ slug }, flags, season] = await Promise.all([
    params,
    searchParams,
    activeSeason(),
  ]);
  if (!season) notFound();

  const project = await prisma.project.findUnique({
    where: { seasonId_slug: { seasonId: season.id, slug } },
    include: {
      repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  // Only the project admin manages a project; anyone else gets the same 404 as a missing one.
  if (!project || project.ownerId !== user.id) notFound();

  const editable = EDITABLE_STATUSES.includes(project.status);
  const allPassed = allReposPassed(project.repos);
  const installUrl = githubAppInstallUrl();
  // Whether the GitHub App tracks the accepted repos (F-06 sets trackingStatus from its webhooks).
  const accepted = project.repos.filter((repo) => repo.approval === "APPROVED");
  const activeCount = accepted.filter(
    (repo) => repo.trackingStatus === "ACTIVE",
  ).length;
  const tracking =
    activeCount === 0
      ? "not_installed"
      : activeCount === accepted.length
        ? "active"
        : "partial";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-(color:--muted) hover:text-(color:--text)"
        >
          ← Dashboard
        </Link>
        <Link
          href={`/projects/${project.slug}`}
          className="ml-auto text-sm text-(color:--ice) hover:underline"
        >
          View project page
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight break-words">
          {project.name}
        </h1>
        <StatusBadge status={project.status} />
      </div>

      {flags.copied && editable && (
        <p
          className="form-alert mt-5 border-(color:--green)! text-(color:--green)!"
          role="status"
        >
          Copied from last season as a new draft. Check the details, then save
          to run the repo checks again.
        </p>
      )}
      {flags.saved && editable && (
        <p
          className="form-alert mt-5 border-(color:--green)! text-(color:--green)!"
          role="status"
        >
          Draft saved. Submit it for review when every repo check passes.
        </p>
      )}
      {flags.submitted && project.status === "SUBMITTED" && (
        <p
          className="form-alert mt-5 border-(color:--green)! text-(color:--green)!"
          role="status"
        >
          Submitted. The Mergio team will review your project and email you when
          its status changes.
        </p>
      )}

      {project.publicReason &&
        (project.status === "CHANGES_REQUESTED" ||
          project.status === "REJECTED") && (
          <section className="panel mt-5 p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--gold) uppercase">
              {project.status === "REJECTED"
                ? "Why it was not approved"
                : "Changes requested"}
            </h2>
            <p className="mt-2 whitespace-pre-line">{project.publicReason}</p>
          </section>
        )}

      {project.status !== "APPROVED" && (
        <section className="panel mt-5 p-6">
          <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
            Repository checks
          </h2>
          <RepoChecks
            repos={project.repos}
            footnote="Checks run again when you save or submit."
          />
        </section>
      )}

      {editable ? (
        <>
          <section className="panel mt-5 p-6">
            <h2 className="text-lg font-semibold">
              {project.status === "CHANGES_REQUESTED"
                ? "Resubmit for review"
                : "Ready to submit?"}
            </h2>
            <p className="mt-1 mb-4 text-sm text-(color:--muted)">
              {allPassed
                ? "Every repo passed its checks. We check them once more when you submit."
                : "Every repo needs to pass its checks first. Fix them on GitHub, then save or submit again."}
            </p>
            <SubmitPanel
              action={submitProjectAction.bind(null, project.id)}
              resubmit={project.status === "CHANGES_REQUESTED"}
            />
          </section>

          <section className="auth-card panel mt-5 max-w-none!">
            <h2 className="text-2xl font-semibold tracking-tight">
              Edit application
            </h2>
            <ProjectForm
              action={saveProjectAction.bind(null, project.id)}
              defaults={{
                name: project.name,
                description: project.description,
                techStack: project.techStack.join(", "),
                difficultyEasy: project.difficultyEasy,
                difficultyMedium: project.difficultyMedium,
                difficultyHard: project.difficultyHard,
                repos: project.repos.map((repo) => repoUrl(repo)).join("\n"),
                logoUrl: project.logoUrl ?? "",
                discordChannel: project.discordChannel ?? "",
                contributingUrl: project.contributingUrl ?? "",
                expectedMentors: project.expectedMentors,
                license: project.license,
              }}
              submitLabel="Save changes"
            />
          </section>
        </>
      ) : project.status === "APPROVED" ? (
        <>
          <section className="panel mt-5 p-6">
            <h2 className="text-lg font-semibold">
              {tracking === "active"
                ? "Contributions are being tracked"
                : "Install the GitHub App"}
            </h2>
            <p className="mt-1 text-sm text-(color:--muted)">
              {tracking === "active"
                ? "The Mergio GitHub App is installed on every accepted repo."
                : tracking === "partial"
                  ? "The Mergio GitHub App is installed on some of your repos. Install it on the rest so their contributions count."
                  : installUrl
                    ? "Your project is live. Install the Mergio GitHub App on its repos; scoring starts once it is installed."
                    : "Your project is live. Next you'll install the Mergio GitHub App on its repos so contributions are tracked. We'll email you when it is ready."}
            </p>
            {tracking !== "active" && installUrl && (
              <a
                className="btn btn-primary mt-4"
                href={installUrl}
                target="_blank"
                rel="noreferrer"
              >
                Install the GitHub App
              </a>
            )}
          </section>

          <section className="panel mt-5 p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              Repositories
            </h2>
            <ul className="mt-4 mb-5 list-none p-0">
              {project.repos.map((repo) => {
                const badge = repoBadge(repo);
                return (
                  <li
                    key={repo.id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-(color:--border) py-3 first:pt-0 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <a
                        href={repoUrl(repo)}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-sm text-(color:--ice) hover:underline"
                      >
                        {repo.owner}/{repo.name}
                      </a>
                      <p
                        className={`mt-0.5 font-mono text-[11px] tracking-wide uppercase ${badge.color}`}
                      >
                        {badge.label}
                      </p>
                    </div>
                    <RemoveRepoButton
                      action={removeRepoAction.bind(null, project.id, repo.id)}
                      label={`${repo.owner}/${repo.name}`}
                    />
                  </li>
                );
              })}
            </ul>
            <AddRepoForm action={addRepoAction.bind(null, project.id)} />
          </section>

          <section className="auth-card panel mt-5 max-w-none!">
            <h2 className="text-2xl font-semibold tracking-tight">
              Project details
            </h2>
            <p className="auth-lead text-base!">
              Once approved, you can still update the description and tech
              stack.
            </p>
            <ApprovedDetailsForm
              action={saveApprovedDetailsAction.bind(null, project.id)}
              description={project.description}
              techStack={project.techStack.join(", ")}
            />
          </section>
        </>
      ) : (
        <section className="panel mt-5 p-6">
          <p className="text-(color:--muted)">
            {project.status === "REJECTED"
              ? "This application was not approved for this season."
              : "Your application is with the Mergio team. You can edit it again if they request changes."}
          </p>
        </section>
      )}
    </div>
  );
}

/** A repo's state on an approved project, in the project admin's words. */
function repoBadge(repo: { approval: string; trackingStatus: string }) {
  if (repo.approval === "PENDING")
    return {
      label: "Awaiting organizer approval",
      color: "text-(color:--gold)",
    };
  if (repo.approval === "REJECTED")
    return { label: "Not accepted", color: "text-[#E5484D]" };
  if (repo.trackingStatus === "ACTIVE")
    return { label: "Tracking active", color: "text-(color:--green)" };
  if (repo.trackingStatus === "SUSPENDED")
    return { label: "Tracking suspended", color: "text-[#E5484D]" };
  return { label: "App not installed", color: "text-(color:--gold)" };
}
