"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";

export async function approveRegistration(registrationId: string) {
  const admin = await requireAdmin();

  const before = await prisma.registration.findUniqueOrThrow({
    where: { id: registrationId },
  });

  const after = await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "APPROVED" },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "APPROVE_REGISTRATION",
    entity: "Registration",
    entityId: registrationId,
    before: { status: before.status },
    after: { status: after.status },
  });

  revalidatePath("/queues/projects");
  revalidatePath("/queues/mentors");
  revalidatePath(`/users/${before.userId}`);
}

export async function rejectRegistration(registrationId: string) {
  const admin = await requireAdmin();

  const before = await prisma.registration.findUniqueOrThrow({
    where: { id: registrationId },
  });

  const after = await prisma.registration.update({
    where: { id: registrationId },
    data: { status: "REJECTED" },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "REJECT_REGISTRATION",
    entity: "Registration",
    entityId: registrationId,
    before: { status: before.status },
    after: { status: after.status },
  });

  revalidatePath("/queues/projects");
  revalidatePath("/queues/mentors");
  revalidatePath(`/users/${before.userId}`);
}
