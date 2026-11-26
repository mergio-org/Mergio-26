import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { ScrollText, Filter } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Audit Trail" };

interface Props {
  searchParams: Promise<{ entity?: string; actorId?: string }>;
}

export default async function AuditLogPage({ searchParams }: Props) {
  await requireAdmin();
  const { entity, actorId } = await searchParams;

  const [logs, entities] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        entity: entity || undefined,
        actorId: actorId || undefined,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        actor: { select: { id: true, name: true, githubLogin: true } },
      },
    }),
    prisma.auditLog.findMany({
      select: { entity: true },
      distinct: ["entity"],
    }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Audit Trail
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Immutable log of every administrative write with actor attribution, before/after states, and mandatory reasons.
          </p>
        </div>
      </div>

      {/* Entity Filters */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="flex items-center gap-1 font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
          <Filter className="h-3 w-3" /> Entity:
        </span>
        <Link
          href="/audit"
          className="rounded-lg px-3 py-1.5 font-medium transition"
          style={{
            backgroundColor: !entity ? "var(--ice)" : "var(--surface-2)",
            color: !entity ? "#0B0D12" : "var(--muted)",
            border: "1px solid var(--border)",
          }}
        >
          All Entities
        </Link>
        {entities.map((e) => (
          <Link
            key={e.entity}
            href={`/audit?entity=${e.entity}`}
            className="rounded-lg px-3 py-1.5 font-medium transition"
            style={{
              backgroundColor: entity === e.entity ? "var(--ice)" : "var(--surface-2)",
              color: entity === e.entity ? "#0B0D12" : "var(--muted)",
              border: "1px solid var(--border)",
            }}
          >
            {e.entity}
          </Link>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="panel overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center text-xs" style={{ color: "var(--dim)" }}>
            No audit records matching this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b" style={{ borderColor: "var(--border)" }}>
                <tr>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity / ID</th>
                  <th className="px-5 py-3.5">Reason</th>
                  <th className="px-5 py-3.5">Before / After Snapshot</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-[var(--surface-2)]">
                    <td className="px-5 py-3.5 whitespace-nowrap" style={{ color: "var(--dim)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text)" }}>
                      <div>
                        <span>{log.actor.name}</span>
                        {log.actor.githubLogin && (
                          <span className="block text-[11px]" style={{ color: "var(--dim)" }}>
                            @{log.actor.githubLogin}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className="rounded px-2 py-0.5 font-mono text-[10px] font-bold"
                        style={{
                          backgroundColor: "var(--ice-soft)",
                          color: "var(--ice)",
                          border: "1px solid rgba(140, 203, 255, 0.25)",
                        }}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-semibold" style={{ color: "var(--text)" }}>
                        {log.entity}
                      </span>
                      <span className="ml-1 block font-mono text-[10px]" style={{ color: "var(--dim)" }}>
                        #{log.entityId.slice(0, 10)}
                      </span>
                    </td>

                    <td className="max-w-[200px] truncate px-5 py-3.5 italic" style={{ color: "var(--muted)" }}>
                      {log.reason || "—"}
                    </td>

                    <td className="px-5 py-3.5">
                      <details className="cursor-pointer">
                        <summary className="font-medium hover:underline text-[11px]" style={{ color: "var(--ice)" }}>
                          Compare JSON Diff
                        </summary>
                        <div
                          className="mt-2 grid grid-cols-2 gap-2 rounded-xl p-3 font-mono text-[10px]"
                          style={{
                            backgroundColor: "var(--surface-2)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div>
                            <span className="font-bold" style={{ color: "var(--red)" }}>
                              Before:
                            </span>
                            <pre className="mt-1 max-h-36 overflow-auto" style={{ color: "var(--text)" }}>
                              {JSON.stringify(log.before, null, 2) || "null"}
                            </pre>
                          </div>
                          <div>
                            <span className="font-bold" style={{ color: "var(--green)" }}>
                              After:
                            </span>
                            <pre className="mt-1 max-h-36 overflow-auto" style={{ color: "var(--text)" }}>
                              {JSON.stringify(log.after, null, 2) || "null"}
                            </pre>
                          </div>
                        </div>
                      </details>
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
