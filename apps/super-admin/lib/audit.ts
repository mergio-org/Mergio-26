import "server-only";
import { prisma, Prisma } from "@repo/db";

/**
 * Write a row to AuditLog. Call this inside every server action that mutates
 * data so that every admin write has an immutable trail of actor + before/after.
 *
 * @param actorId  The id of the admin performing the action.
 * @param action   A SCREAMING_SNAKE_CASE name, e.g. "APPROVE_REGISTRATION".
 * @param entity   The Prisma model name, e.g. "Registration".
 * @param entityId The primary key of the affected row.
 * @param before   Snapshot of the row before the change (or null for creates).
 * @param after    Snapshot of the row after the change (or null for deletes).
 * @param reason   Optional free-text note; required for MANUAL score adjustments.
 */
export async function writeAuditLog({
  actorId,
  action,
  entity,
  entityId,
  before,
  after,
  reason,
}: {
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entity,
      entityId,
      before: (before ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      after: (after ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      reason,
    },
  });
}
