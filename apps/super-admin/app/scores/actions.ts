"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { enqueueJobs } from "@/lib/queue";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const ManualScoreSchema = z.object({
  userId: z.string().min(1, "User is required"),
  seasonId: z.string().min(1, "Season is required"),
  delta: z.coerce.number().int().refine((n) => n !== 0, "Delta cannot be 0"),
  reason: z.string().min(5, "Mandatory reason must be at least 5 characters"),
});

export async function createManualScoreAdjustment(formData: FormData) {
  const admin = await requireAdmin();

  const parsed = ManualScoreSchema.safeParse({
    userId: formData.get("userId"),
    seasonId: formData.get("seasonId"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const { userId, seasonId, delta, reason } = parsed.data;

  const idempotencyKey = `manual:${userId}:${seasonId}:${Date.now()}`;

  // Create ScoreEvent record in the official scoring ledger
  const scoreEvent = await prisma.scoreEvent.create({
    data: {
      userId,
      seasonId,
      kind: "ADJUSTMENT",
      ruleKey: "manual:adjustment",
      points: delta,
      description: reason,
      effectiveAt: new Date(),
      idempotencyKey,
    },
  });

  // Enqueue live leaderboard refresh and user rescore so scores update immediately
  await enqueueJobs([
    { kind: "LEADERBOARD_REFRESH", payload: { seasonId, kind: "user", id: userId } },
    { kind: "USER_RESCORE", payload: { userId } },
  ]);

  // Acceptance: every admin write is in the audit log with actor, before and after values
  await writeAuditLog({
    actorId: admin.id,
    action: "MANUAL_SCORE_ADJUSTMENT",
    entity: "ScoreEvent",
    entityId: scoreEvent.id,
    before: null,
    after: {
      id: scoreEvent.id,
      userId: scoreEvent.userId,
      seasonId: scoreEvent.seasonId,
      points: scoreEvent.points,
      kind: scoreEvent.kind,
      description: scoreEvent.description,
      actorId: admin.id,
    },
    reason,
  });

  revalidatePath("/scores");
  revalidatePath(`/users/${userId}`);
  return { success: true };
}
