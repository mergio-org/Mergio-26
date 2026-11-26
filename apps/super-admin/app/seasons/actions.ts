"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

// ----- Helpers -----

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ----- Season actions -----

const SeasonSchema = z.object({
  name: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  isActive: z.boolean().optional(),
  config: z.string().optional(),
});

export async function createSeason(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = SeasonSchema.safeParse({
    name: formData.get("name"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    isActive: formData.get("isActive") === "on",
    config: formData.get("config") as string,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, startsAt, endsAt, isActive, config } = parsed.data;

  let parsedRules: object = {};
  try {
    if (config) parsedRules = JSON.parse(config);
  } catch {
    return { error: { config: ["Invalid JSON"] } };
  }

  const season = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.season.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
    }

    return tx.season.create({
      data: {
        name,
        slug: toSlug(name),
        codingStartsAt: new Date(startsAt),
        codingEndsAt: new Date(endsAt),
        isActive: isActive ?? false,
        scoringRules: parsedRules,
      },
    });
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "CREATE_SEASON",
    entity: "Season",
    entityId: season.id,
    before: null,
    after: { name, slug: season.slug, codingStartsAt: startsAt, codingEndsAt: endsAt, isActive },
  });

  redirect(`/seasons`);
}

export async function updateSeason(seasonId: string, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = SeasonSchema.safeParse({
    name: formData.get("name"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    isActive: formData.get("isActive") === "on",
    config: formData.get("config") as string,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const before = await prisma.season.findUniqueOrThrow({ where: { id: seasonId } });

  let parsedRules: object = {};
  try {
    if (parsed.data.config) parsedRules = JSON.parse(parsed.data.config);
  } catch {
    return { error: { config: ["Invalid JSON"] } };
  }

  const isActive = parsed.data.isActive ?? false;

  const after = await prisma.$transaction(async (tx) => {
    if (isActive) {
      await tx.season.updateMany({
        where: { isActive: true, id: { not: seasonId } },
        data: { isActive: false },
      });
    }

    return tx.season.update({
      where: { id: seasonId },
      data: {
        name: parsed.data.name,
        codingStartsAt: new Date(parsed.data.startsAt),
        codingEndsAt: new Date(parsed.data.endsAt),
        isActive,
        scoringRules: parsedRules,
      },
    });
  });

  // Write a SeasonChangeLog entry for each changed field.
  const fields: (keyof typeof before)[] = ["name", "codingStartsAt", "codingEndsAt", "isActive", "scoringRules"];
  for (const field of fields) {
    const bVal = JSON.stringify(before[field]);
    const aVal = JSON.stringify(after[field]);
    if (bVal !== aVal) {
      await prisma.seasonChangeLog.create({
        data: {
          seasonId,
          actorId: admin.id,
          field: field as string,
          before: before[field] as object,
          after: after[field] as object,
        },
      });
    }
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "UPDATE_SEASON",
    entity: "Season",
    entityId: seasonId,
    before: { name: before.name, codingStartsAt: before.codingStartsAt, codingEndsAt: before.codingEndsAt, isActive: before.isActive },
    after: { name: after.name, codingStartsAt: after.codingStartsAt, codingEndsAt: after.codingEndsAt, isActive: after.isActive },
  });

  revalidatePath("/seasons");
  redirect("/seasons");
}

// ----- Event actions -----

const EventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
  isActive: z.boolean().optional(),
  config: z.string().optional(),
});

export async function createEvent(seasonId: string, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = EventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") as string,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    isActive: formData.get("isActive") === "on",
    config: formData.get("config") as string,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, description, startsAt, endsAt, isActive, config } = parsed.data;

  let parsedConfig: object = {};
  try {
    if (config) parsedConfig = JSON.parse(config);
  } catch {
    return { error: { config: ["Invalid JSON"] } };
  }

  const event = await prisma.event.create({
    data: {
      seasonId,
      name,
      slug: toSlug(name),
      description,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      isActive: isActive ?? false,
      config: parsedConfig,
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "CREATE_EVENT",
    entity: "Event",
    entityId: event.id,
    before: null,
    after: { name, seasonId, startsAt, endsAt },
  });

  redirect("/seasons");
}

export async function updateEvent(eventId: string, formData: FormData) {
  const admin = await requireAdmin();
  const parsed = EventSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") as string,
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    isActive: formData.get("isActive") === "on",
    config: formData.get("config") as string,
  });
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const before = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  let parsedConfig: object = {};
  try {
    if (parsed.data.config) parsedConfig = JSON.parse(parsed.data.config);
  } catch {
    return { error: { config: ["Invalid JSON"] } };
  }

  const after = await prisma.event.update({
    where: { id: eventId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      isActive: parsed.data.isActive ?? false,
      config: parsedConfig,
    },
  });

  await writeAuditLog({
    actorId: admin.id,
    action: "UPDATE_EVENT",
    entity: "Event",
    entityId: eventId,
    before: { name: before.name, startsAt: before.startsAt, endsAt: before.endsAt, isActive: before.isActive },
    after: { name: after.name, startsAt: after.startsAt, endsAt: after.endsAt, isActive: after.isActive },
  });

  revalidatePath("/seasons");
  redirect("/seasons");
}
