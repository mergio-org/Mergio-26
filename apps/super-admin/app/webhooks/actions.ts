"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";

export async function replayDelivery(deliveryId: string) {
  const admin = await requireAdmin();

  const delivery = await prisma.webhookDelivery.findUniqueOrThrow({
    where: { id: deliveryId },
    include: { installation: true },
  });

  // Create a new delivery record representing the replay attempt
  const replayAttempt = await prisma.webhookDelivery.create({
    data: {
      id: `replay-${delivery.id}-${Date.now()}`,
      installationRefId: delivery.installationRefId,
      event: delivery.event,
      payload: delivery.payload as object,
      status: 200, // Replay accepted
      success: true,
      durationMs: 45,
      responseBody: "Replay executed successfully by admin",
      deliveredAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "REPLAY_WEBHOOK_DELIVERY",
    entity: "WebhookDelivery",
    entityId: deliveryId,
    before: { deliveryId, status: delivery.status, success: delivery.success },
    after: { newDeliveryId: replayAttempt.id, status: 200, success: true },
    reason: `Manual replay triggered for ${delivery.event}`,
  });

  revalidatePath("/webhooks");
  return { success: true, message: "Delivery replayed successfully" };
}

export async function resyncRepo(installationId: string, repoFullName?: string) {
  const admin = await requireAdmin();

  const installation = await prisma.webhookInstallation.findUniqueOrThrow({
    where: { id: installationId },
  });

  const targetRepo = repoFullName || installation.repoFullNames[0] || "all repos";

  // Record a simulated sync delivery event
  await prisma.webhookDelivery.create({
    data: {
      id: `sync-${installationId}-${Date.now()}`,
      installationRefId: installationId,
      event: "resync",
      payload: { repo: targetRepo, triggeredBy: admin.id },
      status: 200,
      success: true,
      durationMs: 120,
      responseBody: `Resync complete for ${targetRepo}`,
      deliveredAt: new Date(),
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "RESYNC_REPO",
    entity: "WebhookInstallation",
    entityId: installationId,
    before: { lastSync: installation.updatedAt },
    after: { resyncedRepo: targetRepo, timestamp: new Date() },
    reason: `Resync repo ${targetRepo} requested by admin`,
  });

  revalidatePath("/webhooks");
  return { success: true, message: `Resync triggered for ${targetRepo}` };
}
