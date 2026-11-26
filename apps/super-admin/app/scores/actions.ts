"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const ManualScoreSchema = z.object({
  userId: z.string().min(1, "User is required"),
  seasonId: z.string().min(1, "Season is required"),
  eventId: z.string().optional().nullable(),
  delta: z.coerce.number().int().refine((n) => n !== 0, "Delta cannot be 0"),
  prNumber: z.coerce.number().int().optional().nullable(),
  repoFullName: z.string().optional().nullable(),
  reason: z.string().min(5, "Mandatory reason must be at least 5 characters"),
});

export async function createManualScoreAdjustment(formData: FormData) {
  const admin = await requireAdmin();

  const rawEventId = formData.get("eventId") as string;
  const rawPrNumber = formData.get("prNumber") as string;
  const rawRepo = formData.get("repoFullName") as string;

  const parsed = ManualScoreSchema.safeParse({
    userId: formData.get("userId"),
    seasonId: formData.get("seasonId"),
    eventId: rawEventId ? rawEventId : null,
    delta: formData.get("delta"),
    prNumber: rawPrNumber ? parseInt(rawPrNumber, 10) : null,
    repoFullName: rawRepo ? rawRepo.trim() : null,
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { userId, seasonId, eventId, delta, prNumber, repoFullName, reason } = parsed.data;

  // Create Score record
  const score = await prisma.score.create({
    data: {
      userId,
      seasonId,
      eventId: eventId || null,
      source: "MANUAL",
      delta,
      prNumber: prNumber || null,
      repoFullName: repoFullName || null,
      reason,
      actorId: admin.id,
    },
  });

  // Acceptance: every admin write is in the audit log with actor, before and after values
  await writeAuditLog({
    actorId: admin.id,
    action: "MANUAL_SCORE_ADJUSTMENT",
    entity: "Score",
    entityId: score.id,
    before: null,
    after: {
      id: score.id,
      userId: score.userId,
      seasonId: score.seasonId,
      eventId: score.eventId,
      delta: score.delta,
      source: score.source,
      reason: score.reason,
      actorId: score.actorId,
    },
    reason,
  });

  revalidatePath("/scores");
  revalidatePath(`/users/${userId}`);
  return { success: true };
}
