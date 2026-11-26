import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import Link from "next/link";
import { Search, ShieldAlert, CheckCircle, Clock } from "lucide-react";

export const metadata = { title: "Users Directory" };

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function UsersPage({ searchParams }: Props) {
  await requireAdmin();
  const { q } = await searchParams;

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { githubLogin: { contains: q, mode: "insensitive" } },
            { profile: { college: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      profile: { select: { college: true, graduationYear: true } },
      registrations: { select: { role: true, status: true } },
      _count: { select: { scores: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Users Directory
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Search across registered participants, inspect role permissions, points ledgers, and manage account statuses.
          </p>
        </div>

        {/* Search input form */}
        <form method="GET" className="relative flex w-full max-w-sm items-center">
          <Search className="absolute left-3.5 h-4 w-4" style={{ color: "var(--dim)" }} />
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by name, email, GitHub, or college..."
            className="w-full rounded-xl pl-10 pr-4 py-2.5 text-xs transition-all focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
            }}
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="panel overflow-hidden">
        {users.length === 0 ? (
          <div className="py-16 text-center text-xs" style={{ color: "var(--dim)" }}>
            {q ? `No participants found matching "${q}".` : "No users registered yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b" style={{ borderColor: "var(--border)" }}>
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">College</th>
                  <th className="px-5 py-3.5">Roles</th>
                  <th className="px-5 py-3.5">Scores</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {u.image ? (
                          <img
                            src={u.image}
                            alt={u.name}
                            className="h-8 w-8 rounded-full object-cover"
                            style={{ border: "1px solid var(--border-strong)" }}
                          />
                        ) : (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                            style={{
                              backgroundColor: "var(--ice-soft)",
                              color: "var(--ice)",
                            }}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold" style={{ color: "var(--text)" }}>
                              {u.name}
                            </span>
                            {u.isAdmin && (
                              <span
                                className="rounded px-1.5 py-0.2 text-[9px] font-bold"
                                style={{
                                  backgroundColor: "var(--ice-soft)",
                                  color: "var(--ice)",
                                }}
                              >
                                ADMIN
                              </span>
                            )}
                          </div>
                          <span style={{ color: "var(--dim)" }}>
                            {u.githubLogin ? `@${u.githubLogin}` : u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5" style={{ color: "var(--muted)" }}>
                      {u.profile?.college ? (
                        <div>
                          <span>{u.profile.college}</span>
                          {u.profile.graduationYear && (
                            <span className="block text-[11px]" style={{ color: "var(--dim)" }}>
                              Class of &apos;{String(u.profile.graduationYear).slice(-2)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "var(--dim)" }}>Not specified</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.registrations.length === 0 ? (
                          <span style={{ color: "var(--dim)" }}>None</span>
                        ) : (
                          u.registrations.map((reg) => (
                            <span
                              key={reg.role}
                              className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor:
                                  reg.status === "APPROVED"
                                    ? "rgba(91, 212, 154, 0.12)"
                                    : "var(--surface-2)",
                                color:
                                  reg.status === "APPROVED"
                                    ? "var(--green)"
                                    : "var(--dim)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {reg.role}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-mono font-medium" style={{ color: "var(--ice)" }}>
                      {u._count.scores} event{u._count.scores !== 1 ? "s" : ""}
                    </td>

                    <td className="px-5 py-3.5">
                      {u.bannedAt ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: "rgba(255, 107, 107, 0.15)",
                            color: "var(--red)",
                          }}
                        >
                          <ShieldAlert className="h-3 w-3" /> Banned
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: "rgba(91, 212, 154, 0.12)",
                            color: "var(--green)",
                          }}
                        >
                          <CheckCircle className="h-3 w-3" /> Active
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/users/${u.id}`}
                        className="rounded-lg px-2.5 py-1 text-xs font-medium transition hover:underline"
                        style={{ color: "var(--ice)" }}
                      >
                        Inspect →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
