import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Icon } from "@/components/landing/icon";
import { excerpt, Markdown } from "@/components/projects/markdown";
import { ProjectLogo } from "@/components/projects/project-logo";
import { StatusBadge } from "@/components/projects/status-badge";
import { getSession } from "@/lib/dal";
import { repoUrl } from "@/lib/projects";
import { activeSeason, canSeeUnpublished } from "@/lib/projects-server";

type Params = { params: Promise<{ slug: string }> };

const trackingLabel = {
  ACTIVE: { label: "Tracking active", color: "text-(color:--green)" },
  NOT_INSTALLED: { label: "App not installed", color: "text-(color:--gold)" },
  SUSPENDED: { label: "Tracking suspended", color: "text-[#E5484D]" },
} as const;

/** The project in the active season, if this viewer may see it. Shared by the page and its metadata. */
const loadProject = cache(async (slug: string) => {
  const season = await activeSeason();
  if (!season) return null;
  const project = await prisma.project.findUnique({
    where: { seasonId_slug: { seasonId: season.id, slug } },
    include: {
      repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
      owner: { select: { name: true, githubLogin: true } },
    },
  });
  if (!project) return null;
  const live =
    project.status === "APPROVED" && project.repos.some((repo) => repo.approval === "APPROVED");
  const session = await getSession();
  if (!live && !canSeeUnpublished(project, session?.user)) return null;
  return { project, live, viewer: session?.user ?? null };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const loaded = await loadProject((await params).slug);
  if (!loaded) return { title: "Project not found — Mergio" };
  return {
    title: `${loaded.project.name} — Mergio`,
    description: excerpt(loaded.project.description, 155),
    robots: loaded.live ? undefined : { index: false, follow: false },
  };
}

export default async function ProjectPage({ params }: Params) {
  const loaded = await loadProject((await params).slug);
  if (!loaded) notFound();
  const { project, live, viewer } = loaded;
  const isOwner = viewer?.id === project.ownerId;
  // Visitors see accepted repos only; the owner and organizers also see ones awaiting approval.
  const repos = live && !isOwner && !viewer?.isAdmin
    ? project.repos.filter((repo) => repo.approval === "APPROVED")
    : project.repos;
  const mix = [
    { label: "Beginner", value: project.difficultyEasy, color: "var(--green)" },
    { label: "Intermediate", value: project.difficultyMedium, color: "var(--ski-blue)" },
    { label: "Advanced", value: project.difficultyHard, color: "var(--violet)" },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Link href="/projects" className="text-sm text-(color:--muted) hover:text-(color:--text)">
        ← All projects
      </Link>

      {!live && (
        <p className="form-alert mt-4 border-(color:--border-strong)! text-(color:--muted)!" role="status">
          Only you{viewer?.isAdmin && !isOwner ? " (as an organizer)" : ""} can see this page until
          the project is approved.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-5">
        <ProjectLogo
          logoUrl={project.logoUrl}
          owner={project.repos[0]?.owner}
          name={project.name}
          size={72}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight break-words">
            {project.name}
          </h1>
          <p className="mt-1 text-(color:--muted)">
            Maintained by{" "}
            {project.owner.githubLogin ? (
              <a
                href={`https://github.com/${project.owner.githubLogin}`}
                target="_blank"
                rel="noreferrer"
                className="text-(color:--ice) hover:underline"
              >
                @{project.owner.githubLogin}
              </a>
            ) : (
              project.owner.name
            )}
          </p>
        </div>
        {!live && <StatusBadge status={project.status} />}
        {isOwner && (
          <Link className="btn btn-ghost btn-sm" href={`/projects/${project.slug}/manage`}>
            Manage
          </Link>
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="panel p-8">
          <Markdown>{project.description}</Markdown>
        </section>

        <aside className="flex flex-col gap-4">
          <section className="panel p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              Tech stack
            </h2>
            <ul className="mt-3 flex list-none flex-wrap gap-1.5 p-0">
              {project.techStack.map((name) => (
                <li key={name}>
                  <Link
                    href={`/projects?tag=${encodeURIComponent(name)}`}
                    className="inline-block rounded-full border border-(color:--border-strong) px-2.5 py-0.5 font-mono text-xs text-(color:--muted) hover:text-(color:--text)"
                  >
                    {name}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="mt-6 font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              Issue levels
            </h2>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-(color:--surface-2)">
              {mix.map((level) =>
                level.value > 0 ? (
                  <span key={level.label} style={{ width: `${level.value}%`, background: level.color }} />
                ) : null,
              )}
            </div>
            <ul className="mt-3 list-none space-y-1 p-0 text-sm">
              {mix.map((level) => (
                <li key={level.label} className="flex justify-between text-(color:--muted)">
                  <span className="inline-flex items-center gap-2">
                    <span className="size-2 rounded-full" style={{ background: level.color }} />
                    {level.label}
                  </span>
                  <span className="font-mono">{level.value}%</span>
                </li>
              ))}
            </ul>

            <dl className="mt-6 mb-0 space-y-2 text-sm">
              <Fact label="License" value={project.license} />
              <Fact label="Mentors expected" value={String(project.expectedMentors)} />
              {project.discordChannel && <Fact label="Discord" value={project.discordChannel} />}
            </dl>
            {project.contributingUrl && (
              <a
                href={project.contributingUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="btn btn-ghost btn-sm mt-5 w-full"
              >
                Contributing guide <span aria-hidden="true">→</span>
              </a>
            )}
          </section>

          <section className="panel p-6">
            <h2 className="font-mono text-xs tracking-widest text-(color:--muted) uppercase">
              Repositories
            </h2>
            <ul className="mt-3 mb-0 list-none space-y-3 p-0">
              {repos.map((repo) => (
                <li key={repo.id} className="text-sm">
                  <a
                    href={repoUrl(repo)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-2 font-mono text-(color:--ice) hover:underline"
                  >
                    <Icon name="repo" size={14} />
                    <span className="truncate">
                      {repo.owner}/{repo.name}
                    </span>
                  </a>
                  {project.status === "APPROVED" && (isOwner || viewer?.isAdmin) && (
                    <p className={`mt-0.5 font-mono text-[11px] tracking-wide uppercase ${
                      repo.approval === "APPROVED"
                        ? trackingLabel[repo.trackingStatus].color
                        : "text-(color:--gold)"
                    }`}>
                      {repo.approval === "APPROVED"
                        ? trackingLabel[repo.trackingStatus].label
                        : "Awaiting organizer approval"}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-(color:--muted)">{label}</dt>
      <dd className="m-0 text-right font-medium break-words">{value}</dd>
    </div>
  );
}
