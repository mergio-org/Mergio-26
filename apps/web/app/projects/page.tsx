import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { excerpt } from "@/components/projects/markdown";
import { ProjectLogo } from "@/components/projects/project-logo";
import { activeSeason, countedRepo, liveProject } from "@/lib/projects-server";

export const metadata: Metadata = {
  title: "Projects — Mergio",
  description: "Open-source projects taking part in Mergio this season.",
};

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string | string[] }>;
}) {
  const raw = (await searchParams).tag;
  const tag = (Array.isArray(raw) ? raw[0] : raw)?.trim() || null;
  const season = await activeSeason();

  const projects = season
    ? await prisma.project.findMany({
        where: {
          seasonId: season.id,
          ...liveProject,
          ...(tag ? { techStack: { has: tag } } : {}),
        },
        orderBy: { approvedAt: "asc" },
        include: {
          repos: { where: countedRepo, orderBy: { createdAt: "asc" }, select: { owner: true } },
        },
      })
    : [];

  // Tags across every live project, for the filter (independent of the current filter).
  const allTags = season
    ? [
        ...new Set(
          (
            await prisma.project.findMany({
              where: { seasonId: season.id, ...liveProject },
              select: { techStack: true },
            })
          ).flatMap((project) => project.techStack),
        ),
      ].sort((a, b) => a.localeCompare(b))
    : [];

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-mono text-xs tracking-widest text-(color:--ice) uppercase">
            {season?.name ?? "Mergio"}
          </p>
          <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Projects
          </h1>
          <p className="mt-3 max-w-xl text-lg text-(color:--muted)">
            Open-source projects taking part this season. Pick one that matches your skills.
          </p>
        </div>
        <Link className="btn btn-primary" href="/projects/new">
          Submit a project
        </Link>
      </div>

      {allTags.length > 0 && (
        <nav aria-label="Filter by technology" className="mt-8 flex flex-wrap gap-2">
          <TagLink href="/projects" active={!tag} label="All" />
          {allTags.map((name) => (
            <TagLink
              key={name}
              href={`/projects?tag=${encodeURIComponent(name)}`}
              active={tag === name}
              label={name}
            />
          ))}
        </nav>
      )}

      {projects.length > 0 ? (
        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.slug}`}
                className="panel flex h-full flex-col gap-4 p-6 transition-colors hover:border-(color:--panel-border-strong)"
              >
                <div className="flex items-center gap-4">
                  <ProjectLogo
                    logoUrl={project.logoUrl}
                    owner={project.repos[0]?.owner}
                    name={project.name}
                    size={48}
                  />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold">{project.name}</h2>
                    <p className="font-mono text-xs text-(color:--dim)">
                      {project.repos.length} {project.repos.length === 1 ? "repo" : "repos"} ·{" "}
                      {project.license}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-(color:--muted)">{excerpt(project.description)}</p>
                <ul className="mt-auto flex list-none flex-wrap gap-1.5 p-0">
                  {project.techStack.map((name) => (
                    <li
                      key={name}
                      className="rounded-full border border-(color:--border-strong) px-2.5 py-0.5 font-mono text-[11px] text-(color:--muted)"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="panel mt-8 p-10 text-center">
          <h2 className="text-xl font-semibold">
            {tag ? `No ${tag} projects yet` : "Projects are being reviewed"}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-(color:--muted)">
            {tag
              ? "Try another technology, or see every project."
              : "Approved projects appear here. Maintainers can submit theirs now."}
          </p>
        </div>
      )}
    </div>
  );
}

function TagLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-(color:--ice) bg-(color:--ice-soft) text-(color:--text)"
          : "border-(color:--border-strong) text-(color:--muted) hover:text-(color:--text)"
      }`}
    >
      {label}
    </Link>
  );
}
