import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import Link from "next/link";
import { Plus, Calendar, Sparkles } from "lucide-react";

export const metadata = { title: "Seasons & Events" };

export default async function SeasonsPage() {
  await requireAdmin();

  const seasons = await prisma.season.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      events: { orderBy: { startsAt: "asc" } },
      _count: { select: { scoreEvents: true } },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Seasons & Events
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            Configure overall programme timelines, scoring rules, and nested coding sprints.
          </p>
        </div>
        <Link href="/seasons/new" className="btn-ice">
          <Plus className="h-4 w-4" />
          New Season
        </Link>
      </div>

      {seasons.length === 0 ? (
        <div className="panel py-16 text-center text-xs" style={{ color: "var(--dim)" }}>
          No seasons configured yet. Create your first season above.
        </div>
      ) : (
        <div className="space-y-5">
          {seasons.map((season) => (
            <div key={season.id} className="panel overflow-hidden">
              {/* Season header */}
              <div
                className="flex flex-wrap items-center justify-between border-b px-6 py-4"
                style={{ borderColor: "var(--border)" }}
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                      {season.name}
                    </h2>
                    <span
                      className="rounded px-2 py-0.5 font-mono text-xs"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        color: "var(--dim)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {season.slug}
                    </span>
                    {season.isActive && (
                      <span
                        className="badge-ice rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    {season.codingStartsAt ? new Date(season.codingStartsAt).toLocaleDateString() : "TBD"} —{" "}
                    {season.codingEndsAt ? new Date(season.codingEndsAt).toLocaleDateString() : "TBD"} ·{" "}
                    <span style={{ color: "var(--ice)" }}>
                      {season._count.scoreEvents} score event{season._count.scoreEvents !== 1 ? "s" : ""}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/seasons/${season.id}/events/new`}
                    className="btn-secondary text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Event
                  </Link>
                  <Link
                    href={`/seasons/${season.id}/edit`}
                    className="btn-secondary text-xs"
                  >
                    Edit Season
                  </Link>
                </div>
              </div>

              {/* Events list */}
              {season.events.length === 0 ? (
                <p className="px-6 py-4 text-xs" style={{ color: "var(--dim)" }}>
                  No sprints or milestone events added yet. Click &ldquo;Add Event&rdquo; to schedule one.
                </p>
              ) : (
                <ul className="divide-y text-xs" style={{ borderColor: "var(--border)" }}>
                  {season.events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: "var(--text)" }}>
                            {event.name}
                          </span>
                          {event.isActive && (
                            <span
                              className="rounded px-1.5 py-0.2 text-[10px] font-bold"
                              style={{
                                backgroundColor: "rgba(91, 212, 154, 0.15)",
                                color: "var(--green)",
                              }}
                            >
                              Live
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px]" style={{ color: "var(--dim)" }}>
                          {new Date(event.startsAt).toLocaleDateString()} —{" "}
                          {new Date(event.endsAt).toLocaleDateString()}
                          {event.description ? ` · ${event.description}` : ""}
                        </p>
                      </div>
                      <Link
                        href={`/seasons/${season.id}/events/${event.id}/edit`}
                        className="text-xs font-medium hover:underline"
                        style={{ color: "var(--ice)" }}
                      >
                        Edit →
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
