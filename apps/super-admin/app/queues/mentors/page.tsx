import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { ApproveRejectButtons } from "@/components/approve-reject-buttons";
import { GraduationCap, CheckCircle } from "lucide-react";

export const metadata = { title: "Mentor Approval Queue" };

export default async function MentorQueuePage() {
  await requireAdmin();

  const registrations = await prisma.registration.findMany({
    where: { role: "MENTOR", status: "PENDING" },
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
          Mentor Approval Queue
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Applicants offering guidance and code reviews for participants. Review expertise before admitting.
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
            All mentor applications have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => (
            <div key={reg.id} className="panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" style={{ color: "var(--ice)" }} />
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
                    {reg.user.profile?.graduationYear
                      ? ` (Class of ${reg.user.profile.graduationYear})`
                      : ""}
                  </p>

                  {reg.answers && (
                    <div
                      className="mt-3 max-w-xl rounded-xl p-3 text-xs"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p className="mb-1 font-semibold uppercase tracking-wider text-[10px]" style={{ color: "var(--ice)" }}>
                        Mentor Questionnaire & Expertise
                      </p>
                      <pre className="overflow-auto font-mono text-[11px]" style={{ color: "var(--text)" }}>
                        {JSON.stringify(reg.answers, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-[11px]" style={{ color: "var(--dim)" }}>
                    Applied {new Date(reg.createdAt).toLocaleDateString()}
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
