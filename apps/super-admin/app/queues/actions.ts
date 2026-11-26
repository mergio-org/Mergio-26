"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { enqueueJobs } from "@/lib/queue";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function approveRegistration(registrationId: string) {
  const admin = await requireAdmin();

  const registration = await prisma.registration.findUniqueOrThrow({
    where: { id: registrationId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const roleName = registration.role === "MENTOR" ? "mentor" : "maintainer";
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://mergio.in";
  const url = `${webUrl}/dashboard`;

  const subject = `You're approved as a Mergio ${roleName}`;
  const body = `You're approved as a ${roleName} for Mergio. ${
    registration.role === "MENTOR"
      ? "Once a project admin adds you to their project, its review queue appears on your dashboard."
      : "You can submit your project from your dashboard."
  }`;

  await prisma.$transaction(async (tx) => {
    await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });

    await tx.emailOutbox.create({
      data: {
        toEmail: registration.user.email,
        toUserId: registration.user.id,
        category: "registration-status",
        subject,
        text: `Hi ${registration.user.name},\n\n${body}\n\n${url}\n`,
        html: `<p>Hi ${escapeHtml(registration.user.name)},</p><p>${escapeHtml(body)}</p><p><a href="${url}">Open your dashboard</a></p>`,
      },
    });
  });

  // If mentor, trigger repo access check and user rescore via scoring queue
  if (registration.role === "MENTOR") {
    const projects = await prisma.projectMentor.findMany({
      where: { userId: registration.userId },
      select: { projectId: true },
    });

    await enqueueJobs([
      { kind: "USER_RESCORE", payload: { userId: registration.userId } },
      ...projects.map((row) => ({ kind: "MENTOR_ACCESS" as const, payload: { projectId: row.projectId } })),
    ]);
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "APPROVE_REGISTRATION",
    entity: "Registration",
    entityId: registrationId,
    before: { status: registration.status },
    after: { status: "APPROVED", role: registration.role },
  });

  revalidatePath("/queues/projects");
  revalidatePath("/queues/mentors");
  revalidatePath(`/users/${registration.userId}`);
}

export async function rejectRegistration(registrationId: string) {
  const admin = await requireAdmin();

  const registration = await prisma.registration.findUniqueOrThrow({
    where: { id: registrationId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  const roleName = registration.role === "MENTOR" ? "mentor" : "maintainer";
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://mergio.in";
  const url = `${webUrl}/dashboard`;

  const subject = `Your Mergio ${roleName} registration`;
  const body = `Thanks for registering as a ${roleName} for Mergio. The team couldn't approve it this time. You can still take part as a contributor.`;

  await prisma.$transaction(async (tx) => {
    await tx.registration.update({
      where: { id: registrationId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });

    await tx.emailOutbox.create({
      data: {
        toEmail: registration.user.email,
        toUserId: registration.user.id,
        category: "registration-status",
        subject,
        text: `Hi ${registration.user.name},\n\n${body}\n\n${url}\n`,
        html: `<p>Hi ${escapeHtml(registration.user.name)},</p><p>${escapeHtml(body)}</p><p><a href="${url}">Open your dashboard</a></p>`,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "REJECT_REGISTRATION",
    entity: "Registration",
    entityId: registrationId,
    before: { status: registration.status },
    after: { status: "REJECTED", role: registration.role },
  });

  revalidatePath("/queues/projects");
  revalidatePath("/queues/mentors");
  revalidatePath(`/users/${registration.userId}`);
}
