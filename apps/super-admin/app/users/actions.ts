"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

// ----- Ban / Unban -----

const BanSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
});

export async function banUser(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = BanSchema.safeParse({
    userId: formData.get("userId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { userId, reason } = parsed.data;

  // Security: prevent banning oneself
  if (admin.id === userId) {
    return { error: { reason: ["You cannot ban your own account."] } };
  }

  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Security: super admins cannot be banned directly
  if (before.isSuperAdmin || before.staffRole === "SUPER_ADMIN") {
    return { error: { reason: ["Super admins cannot be banned. Demote their staff role first."] } };
  }

  // Ban user and delete active sessions in one transaction so they are instantly signed out
  const [after, revoked] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date(), banReason: reason },
    }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  await writeAuditLog({
    actorId: admin.id,
    action: "BAN_USER",
    entity: "User",
    entityId: userId,
    before: { bannedAt: null, banReason: null },
    after: { bannedAt: after.bannedAt, banReason: after.banReason, revokedSessions: revoked.count },
    reason,
  });

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
}

export async function unbanUser(userId: string) {
  const admin = await requireAdmin();

  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: null, banReason: null },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "UNBAN_USER",
    entity: "User",
    entityId: userId,
    before: { bannedAt: before.bannedAt, banReason: before.banReason },
    after: { bannedAt: null, banReason: null },
  });

  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
}

// ----- Role grant -----

const GrantRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["CONTRIBUTOR", "MAINTAINER", "MENTOR"]),
});

export async function grantRole(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = GrantRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { userId, role } = parsed.data;

  // Upsert the registration so we can grant a role even if they never applied.
  const reg = await prisma.registration.upsert({
    where: { userId_role: { userId, role } },
    update: { status: "APPROVED" },
    create: { userId, role, status: "APPROVED" },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "GRANT_ROLE",
    entity: "Registration",
    entityId: reg.id,
    before: null,
    after: { userId, role, status: "APPROVED" },
    reason: "Manual role grant by admin",
  });

  revalidatePath(`/users/${userId}`);
}
