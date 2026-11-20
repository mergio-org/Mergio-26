import { prisma, type Prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/projects/status-badge";
import { requireAdmin } from "@/lib/dal";
import { activeSeason } from "@/lib/projects-server";

export const metadata: Metadata = { title: "Project reviews — Mergio" };

// Tabs over the season's applications. Drafts are listed for visibility but can't be reviewed.
// "Repo requests" holds approved projects with repos added after approval, waiting for a decision.
const TABS: { key: string; label: string; where: Prisma.ProjectWhereInput }[] =
  [
    {
      key: "review",
      label: "Needs review",
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    },
    {
      key: "repos",
      label: "Repo requests",
      where: {
        status: "APPROVED",
        repos: { some: { approval: "PENDING", removedAt: null } },
      },
    },
    {
      key: "changes",
      label: "Changes requested",
      where: { status: "CHANGES_REQUESTED" },
    },
    { key: "approved", label: "Approved", where: { status: "APPROVED" } },
    { key: "rejected", label: "Not approved", where: { status: "REJECTED" } },
    { key: "drafts", label: "Drafts", where: { status: "DRAFT" } },
  ];

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const [{ tab: tabParam }, season] = await Promise.all([
    searchParams,
    activeSeason(),
  ]);
  const tab = TABS.find((t) => t.key === tabParam) ?? TABS[0]!;

  if (!season) {
    return (
      <p className="panel p-8 text-(color:--muted)">
        There is no active season.
      </p>
    );
  }

  const [counts, projects] = await Promise.all([
    Promise.all(
      TABS.map((t) =>
        prisma.project.count({ where: { seasonId: season.id, ...t.where } }),
      ),
    ),
    prisma.project.findMany({
      where: { seasonId: season.id, ...tab.where },
      // Oldest submissions first, so nobody waits longest.
      orderBy: [
        { submittedAt: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" },
      ],
      include: {
        owner: { select: { name: true, githubLogin: true } },
        _count: { select: { repos: { where: { removedAt: null } } } },
      },
    }),
  ]);

  return (
    <div className="w-full">
      <p className="font-mono text-xs tracking-widest text-(color:--ice) uppercase">
        {season.name}
      </p>
      <h1 className="mt-2 text-4xl leading-tight font-semibold tracking-tight">
        Project reviews
      </h1>

      <nav aria-label="Review status" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/projects?tab=${t.key}`}
            aria-current={t.key === tab.key ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              t.key === tab.key
                ? "border-(color:--ice) bg-(color:--ice-soft) text-(color:--text)"
                : "border-(color:--border-strong) text-(color:--muted) hover:text-(color:--text)"
            }`}
          >
            {t.label}
            <span className="font-mono text-xs">{counts[TABS.indexOf(t)]}</span>
          </Link>
        ))}
      </nav>

      {projects.length > 0 ? (
        <div className="panel mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-(color:--border) font-mono text-xs tracking-wide text-(color:--muted) uppercase">
                <th className="px-5 py-3 font-medium">Project</th>
                <th className="px-5 py-3 font-medium">Maintainer</th>
                <th className="px-5 py-3 font-medium">Repos</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-(color:--border) last:border-b-0"
                >
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/admin/projects/${project.id}`}
                      className="font-medium text-(color:--text) hover:text-(color:--ice)"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-(color:--muted)">
                    {project.owner.githubLogin
                      ? `@${project.owner.githubLogin}`
                      : project.owner.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-(color:--muted)">
                    {project._count.repos}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-(color:--muted)">
                    {project.submittedAt
                      ? dateFormat.format(project.submittedAt)
                      : "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={project.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="panel mt-6 p-8 text-(color:--muted)">
          Nothing here right now.
        </p>
      )}
    </div>
  );
}
