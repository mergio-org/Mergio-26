import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { updateSeason } from "@/app/seasons/actions";
import { SeasonForm } from "@/components/season-form";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

export const metadata = { title: "Edit Season" };

export default async function EditSeasonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const season = await prisma.season.findUnique({ where: { id } });
  if (!season) notFound();

  const changeLogs = await prisma.seasonChangeLog.findMany({
    where: { seasonId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  async function handleUpdate(formData: FormData) {
    "use server";
    return updateSeason(id, formData);
  }

  return (
    <div className="p-8">
      <Link
        href="/seasons"
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
        style={{ color: "var(--ice)" }}
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Seasons
      </Link>

      <h1 className="mb-6 text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
        Edit Season: {season.name}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SeasonForm action={handleUpdate} defaultValues={season} />
        </div>

        {/* Change History Panel */}
        <div>
          <div className="panel p-6">
            <div className="mb-4 flex items-center gap-2 border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <History className="h-4 w-4" style={{ color: "var(--ice)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                Season Change History
              </h2>
            </div>

            {changeLogs.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--dim)" }}>
                No changes recorded yet. Edits made above will show before/after diffs here.
              </p>
            ) : (
              <ul className="space-y-3.5">
                {changeLogs.map((log) => (
                  <li
                    key={log.id}
                    className="border-l-2 pl-3 text-xs"
                    style={{ borderColor: "var(--border-strong)" }}
                  >
                    <p className="font-semibold" style={{ color: "var(--text)" }}>
                      Field: {log.field}
                    </p>
                    <p className="font-mono text-[11px] line-through" style={{ color: "var(--red)" }}>
                      {JSON.stringify(log.before)}
                    </p>
                    <p className="font-mono text-[11px]" style={{ color: "var(--green)" }}>
                      {JSON.stringify(log.after)}
                    </p>
                    <p className="mt-0.5 text-[10px]" style={{ color: "var(--dim)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
