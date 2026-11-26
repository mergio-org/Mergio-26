import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { ScoreAdjustModal } from "@/components/score-adjust-modal";
import Link from "next/link";
import { Sparkles, Trophy } from "lucide-react";

export const metadata = { title: "Score Management" };

interface Props {
  searchParams: Promise<{ seasonId?: string }>;
}

export default async function ScoresPage({ searchParams }: Props) {
  await requireAdmin();
  const { seasonId } = await searchParams;

  const [seasons, users, recentScores] = await Promise.all([
    prisma.season.findMany({
      orderBy: { startsAt: "desc" },
      include: {
        events: { select: { id: true, name: true } },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, githubLogin: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.score.findMany({
      where: seasonId ? { seasonId } : undefined,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, githubLogin: true } },
        season: { select: { name: true } },
        event: { select: { name: true } },
      },
    }),
  ]);

  const activeSeason = seasons.find((s) => s.isActive) || seasons[0];
  const currentSeasonFilter = seasonId || activeSeason?.id;

  // Aggregate user points for current selected season
  const userTotals = await prisma.score.groupBy({
    by: ["userId"],
    where: currentSeasonFilter ? { seasonId: currentSeasonFilter } : undefined,
    _sum: { delta: true },
    orderBy: { _sum: { delta: "desc" } },
    take: 10,
  });

  const topUserIds = userTotals.map((u) => u.userId);
  const topUsersMap = new Map(
    (
      await prisma.user.findMany({
        where: { id: { in: topUserIds } },
        select: { id: true, name: true, githubLogin: true },
      })
    ).map((u) => [u.id, u])
  );

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Score Management & Adjustments
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Manual score adjustments, audit-tracked points delta, and season leaderboard.
          </p>
        </div>
        <ScoreAdjustModal users={users} seasons={seasons} />
      </div>

      {/* Season filter pills */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <span style={{ color: "var(--dim)" }}>Filter Season:</span>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/scores"
            className="rounded-lg px-3 py-1.5 font-medium transition"
            style={{
              backgroundColor: !seasonId ? "var(--ice)" : "var(--surface-2)",
              color: !seasonId ? "#0B0D12" : "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            All Seasons
          </Link>
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={`/scores?seasonId=${s.id}`}
              className="rounded-lg px-3 py-1.5 font-medium transition"
              style={{
                backgroundColor: seasonId === s.id ? "var(--ice)" : "var(--surface-2)",
                color: seasonId === s.id ? "#0B0D12" : "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              {s.name} {s.isActive && "(Active)"}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Score Activity Table */}
        <div className="lg:col-span-2">
          <div className="panel overflow-hidden">
            <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Recent Score Events
              </h2>
            </div>

            {recentScores.length === 0 ? (
              <div className="py-16 text-center text-xs" style={{ color: "var(--dim)" }}>
                No score events found for this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b" style={{ borderColor: "var(--border)" }}>
                    <tr>
                      <th className="px-5 py-3">User</th>
                      <th className="px-5 py-3">Delta</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Details / PR</th>
                      <th className="px-5 py-3">Reason</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {recentScores.map((s) => (
                      <tr key={s.id} className="transition-colors hover:bg-[var(--surface-2)]">
                        <td className="px-5 py-3">
                          <Link
                            href={`/users/${s.user.id}`}
                            className="font-medium hover:underline"
                            style={{ color: "var(--text)" }}
                          >
                            {s.user.name}
                          </Link>
                          {s.user.githubLogin && (
                            <span className="ml-1 text-[11px]" style={{ color: "var(--dim)" }}>
                              @{s.user.githubLogin}
                            </span>
                          )}
                        </td>

                        <td
                          className="px-5 py-3 font-mono font-bold"
                          style={{
                            color: s.delta > 0 ? "var(--green)" : "var(--red)",
                          }}
                        >
                          {s.delta > 0 ? `+${s.delta}` : s.delta}
                        </td>

                        <td className="px-5 py-3">
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                            style={{
                              backgroundColor:
                                s.source === "MANUAL"
                                  ? "rgba(255, 192, 105, 0.15)"
                                  : "var(--ice-soft)",
                              color:
                                s.source === "MANUAL"
                                  ? "var(--amber)"
                                  : "var(--ice)",
                            }}
                          >
                            {s.source}
                          </span>
                        </td>

                        <td className="px-5 py-3" style={{ color: "var(--muted)" }}>
                          {s.prNumber ? (
                            <span>
                              PR #{s.prNumber} {s.repoFullName && `(${s.repoFullName})`}
                            </span>
                          ) : (
                            <span>{s.event?.name || s.season.name}</span>
                          )}
                        </td>

                        <td className="max-w-[180px] truncate px-5 py-3" style={{ color: "var(--muted)" }}>
                          {s.reason || "—"}
                        </td>

                        <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--dim)" }}>
                          {new Date(s.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Mini Leaderboard preview */}
        <div>
          <div className="panel p-6">
            <div className="mb-4 flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <Trophy className="h-4 w-4" style={{ color: "var(--ice)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Top Contributors ({currentSeasonFilter ? seasons.find((s) => s.id === currentSeasonFilter)?.name : "Current"})
              </h2>
            </div>

            {userTotals.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--dim)" }}>
                No score records yet.
              </p>
            ) : (
              <ol className="space-y-3">
                {userTotals.map((item, idx) => {
                  const u = topUsersMap.get(item.userId);
                  return (
                    <li
                      key={item.userId}
                      className="flex items-center justify-between border-b pb-2 text-xs"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-4 font-mono font-bold" style={{ color: "var(--dim)" }}>
                          #{idx + 1}
                        </span>
                        <div>
                          <Link
                            href={`/users/${item.userId}`}
                            className="font-medium hover:underline"
                            style={{ color: "var(--text)" }}
                          >
                            {u?.name || "Unknown"}
                          </Link>
                          {u?.githubLogin && (
                            <p className="text-[11px]" style={{ color: "var(--dim)" }}>
                              @{u.githubLogin}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold" style={{ color: "var(--ice)" }}>
                        {item._sum.delta ?? 0} pts
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
