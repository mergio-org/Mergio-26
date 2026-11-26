import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import Link from "next/link";
import {
  Users,
  FolderGit2,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  ScrollText,
} from "lucide-react";

export const metadata = { title: "Organizer Console" };

export default async function DashboardPage() {
  const admin = await requireAdmin();

  // Aggregate dashboard stats
  const [
    pendingProjects,
    pendingMentors,
    totalUsers,
    totalScores,
    recentLogs,
    activeSeason,
  ] = await Promise.all([
    prisma.registration.count({
      where: { role: "MAINTAINER", status: "PENDING" },
    }),
    prisma.registration.count({
      where: { role: "MENTOR", status: "PENDING" },
    }),
    prisma.user.count(),
    prisma.scoreEvent.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        actor: { select: { name: true, githubLogin: true } },
      },
    }),
    prisma.season.findFirst({
      where: { isActive: true },
      include: { events: true },
    }),
  ]);

  const STATS = [
    {
      label: "Project Review Queue",
      value: pendingProjects,
      hint: "Pending maintainer submissions",
      href: "/queues/projects",
      icon: FolderGit2,
      urgent: pendingProjects > 0,
    },
    {
      label: "Mentor Applications",
      value: pendingMentors,
      hint: "Pending mentor reviews",
      href: "/queues/mentors",
      icon: GraduationCap,
      urgent: pendingMentors > 0,
    },
    {
      label: "Registered Users",
      value: totalUsers,
      hint: "Participants, maintainers & mentors",
      href: "/users",
      icon: Users,
    },
    {
      label: "Score Ledger Events",
      value: totalScores,
      hint: "PR merges & score adjustments",
      href: "/scores",
      icon: Sparkles,
    },
  ];

  return (
    <div className="p-8">
      {/* Welcome header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
              Organizer Console
            </h1>
            <span
              className="badge-ice rounded-full px-2.5 py-0.5 text-xs font-semibold"
            >
              {activeSeason ? activeSeason.name : "Active Season"}
            </span>
          </div>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Welcome back, <strong style={{ color: "var(--text)" }}>{admin.name}</strong>. Here is the live status of the Mergio open-source programme.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-2">
          <Link href="/scores" className="btn-ice">
            <Sparkles className="h-4 w-4" />
            Adjust Scores
          </Link>
          <Link href="/exports" className="btn-secondary">
            <Download className="h-4 w-4" />
            Export CSVs
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="panel group relative block p-5 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                  {stat.label}
                </span>
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                  style={{
                    backgroundColor: "var(--ice-soft)",
                    color: "var(--ice)",
                  }}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
                  {stat.value}
                </span>
                {stat.urgent && (
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: "rgba(255, 107, 107, 0.15)",
                      color: "var(--red)",
                    }}
                  >
                    Action Needed
                  </span>
                )}
              </div>

              <p className="mt-1 flex items-center justify-between text-xs" style={{ color: "var(--muted)" }}>
                <span>{stat.hint}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" style={{ color: "var(--ice)" }} />
              </p>
            </Link>
          );
        })}
      </div>

      {/* Content Columns: Active Season & Recent Audit Log */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Active Season Overview Card */}
        <div className="panel p-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
              Active Timeline
            </h2>
            <Link href="/seasons" className="text-xs font-medium hover:underline" style={{ color: "var(--ice)" }}>
              Manage →
            </Link>
          </div>

          {activeSeason ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-base font-bold" style={{ color: "var(--text)" }}>
                  {activeSeason.name}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                  {activeSeason.codingStartsAt ? new Date(activeSeason.codingStartsAt).toLocaleDateString() : "TBD"} —{" "}
                  {activeSeason.codingEndsAt ? new Date(activeSeason.codingEndsAt).toLocaleDateString() : "TBD"}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                  Events & Sprints ({activeSeason.events.length})
                </span>
                {activeSeason.events.length === 0 ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--dim)" }}>
                    No events scheduled yet.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {activeSeason.events.map((ev) => (
                      <li
                        key={ev.id}
                        className="flex items-center justify-between rounded-lg p-2 text-xs"
                        style={{ backgroundColor: "var(--surface-2)" }}
                      >
                        <span className="font-medium" style={{ color: "var(--text)" }}>
                          {ev.name}
                        </span>
                        {ev.isActive ? (
                          <span className="badge-ice rounded px-1.5 py-0.5 text-[10px]">
                            Live
                          </span>
                        ) : (
                          <span className="text-[10px]" style={{ color: "var(--dim)" }}>
                            Upcoming
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs" style={{ color: "var(--dim)" }}>
              No active season configured.{" "}
              <Link href="/seasons/new" className="underline" style={{ color: "var(--ice)" }}>
                Create one now
              </Link>
              .
            </div>
          )}
        </div>

        {/* Live Audit Log Stream */}
        <div className="panel col-span-2 p-6">
          <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" style={{ color: "var(--ice)" }} />
              <h2 className="text-sm font-semibold tracking-tight" style={{ color: "var(--text)" }}>
                Recent Organizer Activity (Audit Trail)
              </h2>
            </div>
            <Link href="/audit" className="text-xs font-medium hover:underline" style={{ color: "var(--ice)" }}>
              View Full Trail →
            </Link>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-12 text-center text-xs" style={{ color: "var(--dim)" }}>
              No administrative writes recorded yet. Actions like approvals, bans, and score adjustments will appear here.
            </div>
          ) : (
            <ul className="divide-y text-xs" style={{ borderColor: "var(--border)" }}>
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--ice)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {log.action}
                      </span>
                      <span className="font-medium" style={{ color: "var(--text)" }}>
                        {log.entity}
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: "var(--dim)" }}>
                        #{log.entityId.slice(0, 8)}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="mt-1 italic" style={{ color: "var(--muted)" }}>
                        &ldquo;{log.reason}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="font-medium" style={{ color: "var(--text)" }}>
                      {log.actor.name}
                    </span>
                    <span className="block text-[11px]" style={{ color: "var(--dim)" }}>
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
