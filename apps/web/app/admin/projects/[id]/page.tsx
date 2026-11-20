import { prisma, type ProjectStatus } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/projects/markdown";
import { RepoChecks } from "@/components/projects/repo-checks";
import { StatusBadge } from "@/components/projects/status-badge";
import { requireAdmin } from "@/lib/dal";
import { statusInfo } from "@/lib/projects";
import { NEEDS_PUBLIC_REASON, TRANSITIONS } from "@/lib/project-status";
import { decideRepoAction, reviewProjectAction } from "../actions";
import { RepoDecisionForm } from "./repo-decision";
import { ReviewForm, type Decision } from "./review-form";

export const metadata: Metadata = { title: "Review project — Mergio" };

const DECISION_LABELS: Partial<Record<ProjectStatus, string>> = {
  UNDER_REVIEW:
    "Start review (lets the project admin know it's being looked at)",
  CHANGES_REQUESTED: "Request changes",
  APPROVED: "Approve",
  REJECTED: "Reject",
};

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function AdminProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ repo?: string }>;
}) {
  await requireAdmin();
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      season: { select: { name: true } },
      owner: { select: { name: true, githubLogin: true, email: true } },
      repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true, githubLogin: true } } },
      },
    },
  });
  if (!project) notFound();

  // Organizers act on submitted applications; submitting is the project admin's move.
  const decisions: Decision[] = TRANSITIONS[project.status]
    .filter((to) => to !== "SUBMITTED")
    .map((to) => ({
      value: to,
      label: DECISION_LABELS[to] ?? statusInfo[to].label,
      needsReason: NEEDS_PUBLIC_REASON.includes(to),
    }));

  // Repos added after approval wait for an organizer; the rest were decided with the project.
  const pendingRepos =
    project.status === "APPROVED"
      ? project.repos.filter((repo) => repo.approval === "PENDING")
      : [];
  const settledRepos = project.repos.filter(
    (repo) => !pendingRepos.includes(repo),
  );

  const facts = [
    { label: "Season", value: project.season.name },
    { label: "Tech stack", value: project.techStack.join(", ") },
    {
      label: "Issue levels",
      value: `${project.difficultyEasy}% beginner · ${project.difficultyMedium}% intermediate · ${project.difficultyHard}% advanced`,
    },
    { label: "License", value: project.license },
    { label: "Mentors expected", value: String(project.expectedMentors) },
    { label: "Discord", value: project.discordChannel },
    { label: "Contributing guide", value: project.contributingUrl, link: true },
    { label: "Logo", value: project.logoUrl, link: true },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/admin/projects"
        className="text-sm text-(color:--muted) hover:text-(color:--text)"
      >
        ← Project reviews
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <h1 className="text-4xl leading-tight font-semibold tracking-tight break-words">
          {project.name}
        </h1>
        <StatusBadge status={project.status} />
        <Link
          href={`/projects/${project.slug}`}
          className="text-sm text-(color:--ice) hover:underline"
        >
          View project page
        </Link>
      </div>
      <p className="mt-2 text-(color:--muted)">
        {project.owner.name}
        {project.owner.githubLogin && (
          <>
            {" · "}
            <a
              href={`https://github.com/${project.owner.githubLogin}`}
              target="_blank"
              rel="noreferrer"
              className="text-(color:--ice) hover:underline"
            >
              @{project.owner.githubLogin}
            </a>
          </>
        )}
        {" · "}
        <a href={`mailto:${project.owner.email}`} className="hover:underline">
          {project.owner.email}
        </a>
      </p>

      {(flags.repo === "accepted" || flags.repo === "rejected") && (
        <p
          className="form-alert mt-5 border-(color:--green)! text-(color:--green)!"
          role="status"
        >
          Repo {flags.repo}. The project admin has been emailed.
        </p>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="panel p-8">
            <Markdown>{project.description}</Markdown>
          </section>

          <section className="panel p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              Details
            </h2>
            <dl className="mt-3 mb-0">
              {facts.map(({ label, value, link }) => (
                <div
                  key={label}
                  className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 border-b border-(color:--border) py-2.5 text-sm last:border-b-0"
                >
                  <dt className="text-(color:--muted)">{label}</dt>
                  <dd className="m-0 min-w-0 text-right break-words">
                    {value ? (
                      link ? (
                        <a
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-(color:--ice) hover:underline"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {pendingRepos.length > 0 && (
            <section className="panel border-(color:--gold)! p-6">
              <h2 className="font-mono text-xs tracking-widest text-(color:--gold) uppercase">
                Repo requests
              </h2>
              <p className="mt-1 text-sm text-(color:--muted)">
                Added after approval. They count only once you accept them.
              </p>
              {pendingRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="mt-4 border-t border-(color:--border) pt-4 first-of-type:border-t-0"
                >
                  <RepoChecks repos={[repo]} />
                  <RepoDecisionForm
                    action={decideRepoAction.bind(null, project.id, repo.id)}
                  />
                </div>
              ))}
            </section>
          )}

          <section className="panel p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              Repository checks
            </h2>
            <RepoChecks
              repos={settledRepos}
              footnote="The checks run as the project admin, when they save or submit."
            />
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="panel p-6">
            <h2 className="text-lg font-semibold">Review</h2>
            {decisions.length === 0 && (
              <p className="mt-1 text-sm text-(color:--muted)">
                {project.status === "DRAFT" ||
                project.status === "CHANGES_REQUESTED"
                  ? "Waiting for the project admin to submit. You can still leave internal notes."
                  : "This application has a final decision. You can still leave internal notes."}
              </p>
            )}
            <ReviewForm
              action={reviewProjectAction.bind(
                null,
                project.id,
                project.status,
              )}
              decisions={decisions}
            />
          </section>

          <section className="panel p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              History
            </h2>
            {project.reviews.length > 0 ? (
              <ol className="mt-4 mb-0 list-none space-y-4 p-0">
                {project.reviews.map((review) => (
                  <li
                    key={review.id}
                    className="border-l-2 border-(color:--border-strong) pl-3.5 text-sm"
                  >
                    <p className="font-medium">
                      {review.toStatus
                        ? `${review.fromStatus ? statusInfo[review.fromStatus].label : "—"} → ${statusInfo[review.toStatus].label}`
                        : "Internal note"}
                    </p>
                    <p className="text-xs text-(color:--dim)">
                      {review.actor
                        ? review.actor.githubLogin
                          ? `@${review.actor.githubLogin}`
                          : review.actor.name
                        : "A deleted user"}
                      {" · "}
                      {timeFormat.format(review.createdAt)}
                    </p>
                    {review.publicReason && (
                      <p className="mt-1.5 whitespace-pre-line">
                        <span className="text-(color:--muted)">
                          To the project admin:{" "}
                        </span>
                        {review.publicReason}
                      </p>
                    )}
                    {review.internalNote && (
                      <p className="mt-1.5 whitespace-pre-line text-(color:--gold)">
                        <span className="text-(color:--muted)">Internal: </span>
                        {review.internalNote}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-(color:--muted)">
                No activity yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
