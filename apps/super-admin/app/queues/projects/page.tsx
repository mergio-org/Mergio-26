import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { ApproveRejectButtons } from "@/components/approve-reject-buttons";
import { ExternalLink, FolderGit2, CheckCircle } from "lucide-react";

export const metadata = { title: "Project Review Queue" };

export default async function ProjectQueuePage() {
  await requireAdmin();

  const registrations = await prisma.registration.findMany({
    where: { role: "MAINTAINER", status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Project Review Queue
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Maintainers who submitted open-source repositories for inclusion in Mergio. Verify documentation and issue readiness before approving.
        </p>
      </div>

      {registrations.length === 0 ? (
        <div className="panel flex flex-col items-center justify-center p-16 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{
              backgroundColor: "rgba(91, 212, 154, 0.15)",
              color: "var(--green)",
            }}
          >
            <CheckCircle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-semibold" style={{ color: "var(--text)" }}>
            Queue is Empty
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--dim)" }}>
            All maintainer repository applications have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div key={reg.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4" style={{ color: "var(--ice)" }} />
                    <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                      {reg.user.name}
                    </span>
                    {reg.user.githubLogin && (
                      <span className="font-mono text-xs" style={{ color: "var(--dim)" }}>
                        (@{reg.user.githubLogin})
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                    {reg.user.email}
                    {reg.user.profile?.college ? ` · ${reg.user.profile.college}` : ""}
                  </p>

                  {reg.repoUrl && (
                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={reg.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs font-medium hover:underline"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--ice)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {reg.repoUrl}
                      </a>
                    </div>
                  )}

                  {reg.answers && (
                    <details className="mt-3 cursor-pointer text-xs">
                      <summary className="font-medium hover:underline" style={{ color: "var(--ice)" }}>
                        View Application Questionnaire
                      </summary>
                      <pre
                        className="mt-2 max-w-xl overflow-auto rounded-lg p-3 font-mono text-[11px]"
                        style={{
                          backgroundColor: "var(--surface-2)",
                          color: "var(--text)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {JSON.stringify(reg.answers, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-[11px]" style={{ color: "var(--dim)" }}>
                    Submitted {new Date(reg.createdAt).toLocaleDateString()}
                  </span>
                  <ApproveRejectButtons registrationId={reg.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
