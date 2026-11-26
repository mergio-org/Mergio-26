import { requireAdmin } from "@/lib/dal";
import { prisma } from "@repo/db";
import { ReplayButton, ResyncRepoButton } from "@/components/webhook-action-buttons";
import { CheckCircle2, AlertCircle, Clock, Webhook } from "lucide-react";

export const metadata = { title: "Webhook Health" };

export default async function WebhooksPage() {
  await requireAdmin();

  const [installations, recentDeliveries] = await Promise.all([
    prisma.webhookInstallation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        deliveries: {
          orderBy: { deliveredAt: "desc" },
          take: 50,
          select: { id: true, success: true, deliveredAt: true },
        },
      },
    }),
    prisma.webhookDelivery.findMany({
      orderBy: { deliveredAt: "desc" },
      take: 30,
      include: {
        installation: { select: { accountLogin: true } },
      },
    }),
  ]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Webhook Health & Delivery Monitoring
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Monitor GitHub App installations, delivery logs, failure rates, and trigger payload replays or repo resyncs.
        </p>
      </div>

      {/* Installations overview */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
          Active GitHub App Installations
        </h2>
        {installations.length === 0 ? (
          <div className="panel p-12 text-center text-xs" style={{ color: "var(--dim)" }}>
            No GitHub App installations registered yet. Installations and webhook events will be logged here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {installations.map((inst) => {
              const total = inst.deliveries.length;
              const failed = inst.deliveries.filter((d) => !d.success).length;
              const failureRate = total > 0 ? ((failed / total) * 100).toFixed(1) : "0.0";
              const lastDelivery = inst.deliveries[0];

              return (
                <div
                  key={inst.id}
                  className="panel flex flex-col justify-between p-5"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-sm" style={{ color: "var(--text)" }}>
                          {inst.accountLogin}
                        </h3>
                        <p className="text-xs" style={{ color: "var(--dim)" }}>
                          {inst.accountType} (ID: {inst.githubId})
                        </p>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: inst.isActive
                            ? "rgba(91, 212, 154, 0.15)"
                            : "rgba(255, 107, 107, 0.15)",
                          color: inst.isActive ? "var(--green)" : "var(--red)",
                        }}
                      >
                        {inst.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs">
                      <div className="flex justify-between" style={{ color: "var(--muted)" }}>
                        <span>Covered Repos:</span>
                        <span className="font-mono text-right" style={{ color: "var(--text)" }}>
                          {inst.repoFullNames.length > 0
                            ? inst.repoFullNames.join(", ")
                            : "All account repositories"}
                        </span>
                      </div>
                      <div className="flex justify-between" style={{ color: "var(--muted)" }}>
                        <span>Last Delivery:</span>
                        <span style={{ color: "var(--text)" }}>
                          {lastDelivery
                            ? new Date(lastDelivery.deliveredAt).toLocaleTimeString()
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex justify-between" style={{ color: "var(--muted)" }}>
                        <span>Recent Failure Rate:</span>
                        <span
                          className="font-semibold"
                          style={{
                            color: parseFloat(failureRate) > 5 ? "var(--red)" : "var(--green)",
                          }}
                        >
                          {failureRate}% ({failed}/{total})
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4" style={{ borderColor: "var(--border)" }}>
                    <ResyncRepoButton installationId={inst.id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Deliveries Log */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
          Recent Deliveries Log
        </h2>
        <div className="panel overflow-hidden">
          {recentDeliveries.length === 0 ? (
            <div className="p-12 text-center text-xs" style={{ color: "var(--dim)" }}>
              No deliveries logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b" style={{ borderColor: "var(--border)" }}>
                  <tr>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Account</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Delivered</th>
                    <th className="px-5 py-3">Payload</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {recentDeliveries.map((del) => (
                    <tr key={del.id} className="transition-colors hover:bg-[var(--surface-2)]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {del.success ? (
                            <CheckCircle2 className="h-4 w-4" style={{ color: "var(--green)" }} />
                          ) : (
                            <AlertCircle className="h-4 w-4" style={{ color: "var(--red)" }} />
                          )}
                          <span
                            className="font-mono font-bold"
                            style={{
                              color: del.success ? "var(--green)" : "var(--red)",
                            }}
                          >
                            {del.status || (del.success ? 200 : 500)}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 font-semibold" style={{ color: "var(--text)" }}>
                        {del.event}
                      </td>

                      <td className="px-5 py-3" style={{ color: "var(--muted)" }}>
                        {del.installation?.accountLogin ?? "GitHub App"}
                      </td>

                      <td className="px-5 py-3 font-mono" style={{ color: "var(--dim)" }}>
                        {del.durationMs !== null ? `${del.durationMs}ms` : "—"}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap" style={{ color: "var(--dim)" }}>
                        {new Date(del.deliveredAt).toLocaleTimeString()}
                      </td>

                      <td className="px-5 py-3">
                        <details className="cursor-pointer">
                          <summary className="font-medium hover:underline" style={{ color: "var(--ice)" }}>
                            Inspect JSON
                          </summary>
                          <pre
                            className="mt-2 max-h-36 max-w-xs overflow-auto rounded-lg p-2 font-mono text-[10px]"
                            style={{
                              backgroundColor: "var(--surface-2)",
                              color: "var(--text)",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {JSON.stringify(del.payload, null, 2)}
                          </pre>
                        </details>
                      </td>

                      <td className="px-5 py-3 text-right">
                        <ReplayButton deliveryId={del.id} />
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
  );
}
