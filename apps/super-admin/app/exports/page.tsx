import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { Download, FileSpreadsheet } from "lucide-react";

export const metadata = { title: "CSV Data Exports" };

interface Props {
  searchParams: Promise<{ seasonId?: string }>;
}

export default async function ExportsPage({ searchParams }: Props) {
  await requireAdmin();
  const { seasonId } = await searchParams;

  const seasons = await prisma.season.findMany({
    orderBy: { startsAt: "desc" },
  });

  const activeSeason = seasons.find((s) => s.isActive) || seasons[0];
  const selectedSeasonId = seasonId || activeSeason?.id || "";

  const exportTypes = [
    {
      id: "contributors",
      title: "Contributors & Participants",
      description:
        "Full CSV dump of registered participants with colleges, graduation years, contacts, role statuses, and ban standing.",
      scopedToSeason: false,
    },
    {
      id: "prs",
      title: "Pull Requests & Merges",
      description:
        "List of all score-linked pull requests with repository names, user GitHub logins, awarded points, and justifications.",
      scopedToSeason: true,
    },
    {
      id: "leaderboard",
      title: "Final Season Leaderboard",
      description:
        "Ranked list of contributors with aggregate scores and PR counts for the selected season.",
      scopedToSeason: true,
    },
    {
      id: "certificates",
      title: "Certificate Recipient List",
      description:
        "Approved maintainers, mentors, and active contributors meeting minimum score thresholds for certificate issuance.",
      scopedToSeason: true,
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Data Exports (CSV)
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Download verified participant lists, pull request records, final rankings, and certificate recipient batches.
        </p>
      </div>

      {/* Season Scope Selector */}
      {seasons.length > 0 && (
        <div
          className="panel mb-8 flex flex-wrap items-center gap-3 p-4 text-xs"
        >
          <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
            Season Scope:
          </span>
          <div className="flex flex-wrap gap-2">
            {seasons.map((s) => (
              <a
                key={s.id}
                href={`/exports?seasonId=${s.id}`}
                className="rounded-lg px-3 py-1.5 font-medium transition"
                style={{
                  backgroundColor: selectedSeasonId === s.id ? "var(--ice)" : "var(--surface-2)",
                  color: selectedSeasonId === s.id ? "#0B0D12" : "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                {s.name} {s.isActive && "(Active)"}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Export Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {exportTypes.map((item) => {
          const downloadUrl = `/api/export/${item.id}${
            item.scopedToSeason && selectedSeasonId ? `?seasonId=${selectedSeasonId}` : ""
          }`;

          return (
            <div
              key={item.id}
              className="panel flex flex-col justify-between p-6"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: "var(--ice-soft)",
                      color: "var(--ice)",
                    }}
                  >
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <h2 className="text-base font-bold" style={{ color: "var(--text)" }}>
                    {item.title}
                  </h2>
                </div>

                <p className="mt-2.5 text-xs" style={{ color: "var(--muted)" }}>
                  {item.description}
                </p>

                {item.scopedToSeason && (
                  <span
                    className="mt-3 inline-block rounded-md px-2 py-0.5 font-mono text-[11px]"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--dim)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Scope: {seasons.find((s) => s.id === selectedSeasonId)?.name || "All Seasons"}
                  </span>
                )}
              </div>

              <div className="mt-6 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                <a
                  href={downloadUrl}
                  download
                  className="btn-ice inline-flex"
                >
                  <Download className="h-4 w-4" />
                  Download CSV
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
