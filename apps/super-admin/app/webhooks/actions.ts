"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { enqueueJobs, type Job } from "@/lib/queue";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";

function jobsFor(event: string, payload: any): Job[] {
  const repoId = payload?.repository ? String(payload.repository.id) : null;
  switch (event) {
    case "pull_request":
    case "pull_request_review":
      return repoId && payload?.pull_request
        ? [{ kind: "PULL_REQUEST", payload: { githubRepoId: repoId, number: payload.pull_request.number } }]
        : [];
    case "issues":
      return repoId && payload?.issue && !payload.issue.pull_request
        ? [{ kind: "ISSUE", payload: { githubRepoId: repoId, number: payload.issue.number } }]
        : [];
    case "label":
      return repoId && payload?.action !== "created"
        ? [{ kind: "REPO_RESYNC", payload: { githubRepoId: repoId } }]
        : [];
    case "installation":
    case "installation_repositories":
      return payload?.installation && payload?.action
        ? [
            {
              kind: "INSTALLATION",
              payload: {
                installationId: String(payload.installation.id),
                action: payload.action,
                githubRepoIds: [
                  ...((payload.repositories || []).map((r: any) => String(r.id))),
                  ...((payload.repositories_added || []).map((r: any) => String(r.id))),
                  ...((payload.repositories_removed || []).map((r: any) => String(r.id))),
                ].sort(),
              },
            },
          ]
        : [];
    case "repository":
      return repoId && payload?.action
        ? [{ kind: "REPOSITORY", payload: { githubRepoId: repoId, action: payload.action } }]
        : [];
    default:
      return [];
  }
}

export async function replayDelivery(deliveryId: string) {
  const admin = await requireAdmin();

  const delivery = await prisma.webhookDelivery.findUniqueOrThrow({
    where: { id: deliveryId },
  });

  const jobs = jobsFor(delivery.event, delivery.payload as any);
  if (jobs.length > 0) {
    await enqueueJobs(jobs);
  }

  // Create a new delivery record representing the replay attempt
  const replayAttempt = await prisma.webhookDelivery.create({
    data: {
      id: `replay-${delivery.id}-${Date.now()}`,
      installationRefId: delivery.installationRefId,
      event: delivery.event,
      payload: delivery.payload as object,
      status: 202, // Accepted for queueing
      success: true,
      durationMs: 25,
      responseBody: `Replay queued ${jobs.length} worker job(s)`,
      deliveredAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "REPLAY_WEBHOOK_DELIVERY",
    entity: "WebhookDelivery",
    entityId: deliveryId,
    before: { deliveryId, status: delivery.status, success: delivery.success },
    after: { newDeliveryId: replayAttempt.id, queuedJobs: jobs.length, success: true },
    reason: `Manual replay triggered for ${delivery.event}`,
  });

  revalidatePath("/webhooks");
  return { success: true, message: `Delivery replayed: ${jobs.length} job(s) queued for worker.` };
}

export async function resyncRepo(installationId: string, repoFullName?: string) {
  const admin = await requireAdmin();

  const installation = await prisma.webhookInstallation.findUnique({
    where: { id: installationId },
  });

  const targetRepo = repoFullName || installation?.repoFullNames[0];
  const [owner, name] = targetRepo?.split("/") ?? [];

  const repos = await prisma.projectRepo.findMany({
    where: {
      removedAt: null,
      ...(owner && name
        ? {
            owner: { equals: owner, mode: "insensitive" },
            name: { equals: name, mode: "insensitive" },
          }
        : {}),
    },
    select: { githubRepoId: true, owner: true, name: true },
    distinct: ["githubRepoId"],
  });

  if (repos.length > 0) {
    await enqueueJobs(
      repos.map((r) => ({
        kind: "REPO_RESYNC" as const,
        payload: { githubRepoId: r.githubRepoId.toString() },
      }))
    );
  }

  // Record a sync delivery event
  await prisma.webhookDelivery.create({
    data: {
      id: `sync-${installationId}-${Date.now()}`,
      installationRefId: installationId,
      event: "resync",
      payload: { repo: targetRepo || "all", queuedCount: repos.length, triggeredBy: admin.id },
      status: 200,
      success: true,
      durationMs: 40,
      responseBody: `Queued ${repos.length} repo resync jobs`,
      deliveredAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "RESYNC_REPO",
    entity: "WebhookInstallation",
    entityId: installationId,
    before: { lastSync: installation?.updatedAt },
    after: { resyncedRepo: targetRepo || "all", queuedRepos: repos.length, timestamp: new Date() },
    reason: `Resync requested by admin for ${targetRepo || "all repos"}`,
  });

  revalidatePath("/webhooks");
  return { success: true, message: `Resync queued ${repos.length} repo(s) for worker.` };
}
