import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BanButton } from "@/components/ban-button";
import { RoleGrantButton } from "@/components/role-grant-button";
import { ArrowLeft, GitPullRequest, Award, Shield, User } from "lucide-react";

export const metadata = { title: "User Details" };

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      registrations: true,
      scores: {
        orderBy: { createdAt: "desc" },
        include: {
          season: { select: { name: true } },
          event: { select: { name: true } },
        },
      },
    },
  });

  if (!user) notFound();

  const totalScore = user.scores.reduce((sum, s) => sum + s.delta, 0);
  const existingRoles = user.registrations.map((r) => r.role);

  // Fetch audit logs affecting this user
  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "User", entityId: id },
    orderBy: { createdAt: "desc" },
    include: { actor: { select: { name: true } } },
    take: 10,
  });

  return (
    <div className="p-8">
      <Link
        href="/users"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
        style={{ color: "var(--ice)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Users Directory
      </Link>

      {/* User Header Profile Card */}
      <div className="panel mb-8 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-16 w-16 rounded-full object-cover"
                style={{ border: "2px solid var(--border-strong)" }}
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                style={{
                  backgroundColor: "var(--ice-soft)",
                  color: "var(--ice)",
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
                  {user.name}
                </h1>
                {user.isAdmin && (
                  <span
                    className="badge-ice rounded px-2 py-0.5 text-xs font-semibold"
                  >
                    ORGANIZER
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs" style={{ color: "var(--dim)" }}>
                {user.githubLogin ? `@${user.githubLogin} · ` : ""}
                {user.email} · Registered {new Date(user.createdAt).toLocaleDateString()}
              </p>
              {user.profile && (
                <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                  {user.profile.college} (Class of {user.profile.graduationYear})
                  {user.profile.discord ? ` · Discord: ${user.profile.discord}` : ""}
                </p>
              )}
            </div>
          </div>

          <BanButton
            userId={user.id}
            isBanned={!!user.bannedAt}
            banReason={user.banReason}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Registrations & Roles */}
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" style={{ color: "var(--ice)" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Role Registrations
                </h2>
              </div>
            </div>

            {user.registrations.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--dim)" }}>
                No roles applied.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {user.registrations.map((reg) => (
                  <li
                    key={reg.id}
                    className="flex items-center justify-between rounded-xl p-3 text-xs"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div>
                      <span className="font-semibold" style={{ color: "var(--text)" }}>
                        {reg.role}
                      </span>
                      {reg.repoUrl && (
                        <a
                          href={reg.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 block truncate text-[11px] hover:underline"
                          style={{ color: "var(--ice)" }}
                        >
                          {reg.repoUrl}
                        </a>
                      )}
                    </div>
                    <span
                      className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                      style={{
                        backgroundColor:
                          reg.status === "APPROVED"
                            ? "rgba(91, 212, 154, 0.15)"
                            : reg.status === "PENDING"
                            ? "rgba(255, 192, 105, 0.15)"
                            : "rgba(255, 107, 107, 0.15)",
                        color:
                          reg.status === "APPROVED"
                            ? "var(--green)"
                            : reg.status === "PENDING"
                            ? "var(--amber)"
                            : "var(--red)",
                      }}
                    >
                      {reg.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
              <RoleGrantButton userId={user.id} existingRoles={existingRoles} />
            </div>
          </div>

          {/* Admin Audit History on this user */}
          <div className="panel p-5">
            <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--text)" }}>
              Admin Operations on User
            </h2>
            {auditLogs.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--dim)" }}>
                No administrative writes logged for this profile.
              </p>
            ) : (
              <ul className="space-y-3">
                {auditLogs.map((log) => (
                  <li key={log.id} className="border-l-2 pl-3 text-xs" style={{ borderColor: "var(--border-strong)" }}>
                    <div className="flex items-center gap-1.5 font-medium" style={{ color: "var(--text)" }}>
                      <span>{log.action}</span>
                      <span style={{ color: "var(--dim)" }}>by {log.actor.name}</span>
                    </div>
                    {log.reason && (
                      <p className="mt-0.5 italic" style={{ color: "var(--muted)" }}>
                        {log.reason}
                      </p>
                    )}
                    <span className="block text-[10px]" style={{ color: "var(--dim)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Column: Score Ledger */}
        <div className="lg:col-span-2">
          <div className="panel p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4" style={{ borderColor: "var(--border)" }}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                  Full Score Ledger
                </h2>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  Immutable record of earned and adjusted points.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                  Total Points
                </span>
                <p className="font-mono text-2xl font-black" style={{ color: "var(--ice)" }}>
                  {totalScore} pts
                </p>
              </div>
            </div>

            {user.scores.length === 0 ? (
              <div className="py-12 text-center text-xs" style={{ color: "var(--dim)" }}>
                No score events recorded yet for this participant.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b" style={{ borderColor: "var(--border)" }}>
                    <tr>
                      <th className="py-2.5">Delta</th>
                      <th className="py-2.5">Source</th>
                      <th className="py-2.5">PR / Repo</th>
                      <th className="py-2.5">Season / Event</th>
                      <th className="py-2.5">Reason</th>
                      <th className="py-2.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {user.scores.map((score) => (
                      <tr key={score.id}>
                        <td
                          className="py-3 font-mono font-bold"
                          style={{
                            color: score.delta > 0 ? "var(--green)" : "var(--red)",
                          }}
                        >
                          {score.delta > 0 ? `+${score.delta}` : score.delta}
                        </td>
                        <td className="py-3">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor:
                                score.source === "MANUAL"
                                  ? "rgba(255, 192, 105, 0.15)"
                                  : "var(--ice-soft)",
                              color:
                                score.source === "MANUAL"
                                  ? "var(--amber)"
                                  : "var(--ice)",
                            }}
                          >
                            {score.source}
                          </span>
                        </td>
                        <td className="py-3" style={{ color: "var(--text)" }}>
                          {score.prNumber ? (
                            <span>
                              PR #{score.prNumber} {score.repoFullName && `(${score.repoFullName})`}
                            </span>
                          ) : (
                            <span style={{ color: "var(--dim)" }}>—</span>
                          )}
                        </td>
                        <td className="py-3" style={{ color: "var(--dim)" }}>
                          {score.event?.name || score.season.name}
                        </td>
                        <td className="max-w-[160px] truncate py-3" style={{ color: "var(--muted)" }}>
                          {score.reason || "—"}
                        </td>
                        <td className="py-3 whitespace-nowrap" style={{ color: "var(--dim)" }}>
                          {new Date(score.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
