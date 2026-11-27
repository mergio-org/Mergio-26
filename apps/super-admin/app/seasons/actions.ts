"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, Prisma } from "@repo/db";
import { requireAdmin } from "@/lib/dal";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

// ----- Helpers -----

const IST_OFFSET_MS = 330 * 60_000;
const DAY_MS = 86_400_000;

function istDayStart(day: string): Date {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) - IST_OFFSET_MS);
}

function addDays(day: string, days: number): string {
  return new Date(Date.parse(`${day}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

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

  const slug = toSlug(name);
  if (!slug) {
    return { error: { name: ["Season name must contain alphanumeric characters."] } };
  }

  const existingSeason = await prisma.season.findUnique({ where: { slug } });
  if (existingSeason) {
    return { error: { name: ["A season with this name or slug already exists."] } };
  }

  let parsedRules: object = {};
  if (config && config.trim().length > 0) {
    try {
      parsedRules = JSON.parse(config);
    } catch {
      return { error: { config: ["Invalid JSON"] } };
    }
  }

  const codingStartsAt = istDayStart(startsAt);
  const codingEndsAt = new Date(istDayStart(addDays(endsAt, 1)).getTime() - 1);

  let season;
  try {
    season = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.season.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.season.create({
        data: {
          name,
          slug,
          codingStartsAt,
          codingEndsAt,
          isActive: isActive ?? false,
          scoringRules: parsedRules,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: { name: ["A season with this name or slug already exists."] } };
    }
    throw error;
  }

  await writeAuditLog({
    actorId: admin.id,
    action: "CREATE_SEASON",
    entity: "Season",
    entityId: season.id,
    before: null,
    after: { name, slug: season.slug, codingStartsAt, codingEndsAt, isActive },
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

  let parsedRules: object | null = null;
  if (parsed.data.config && parsed.data.config.trim().length > 0) {
    try {
      parsedRules = JSON.parse(parsed.data.config);
    } catch {
      return { error: { config: ["Invalid JSON"] } };
    }
  }

  const isActive = parsed.data.isActive ?? false;
  const codingStartsAt = istDayStart(parsed.data.startsAt);
  const codingEndsAt = new Date(istDayStart(addDays(parsed.data.endsAt, 1)).getTime() - 1);

  let after;
  try {
    after = await prisma.$transaction(async (tx) => {
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
          codingStartsAt,
          codingEndsAt,
          isActive,
          scoringRules: parsedRules ?? Prisma.DbNull,
        },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: { name: ["A season with this name or slug already exists."] } };
    }
    throw error;
  }

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
          before: before[field] == null ? Prisma.DbNull : (JSON.parse(JSON.stringify(before[field])) as Prisma.InputJsonValue),
          after: after[field] == null ? Prisma.DbNull : (JSON.parse(JSON.stringify(after[field])) as Prisma.InputJsonValue),
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

  const slug = toSlug(name);
  if (!slug) {
    return { error: { name: ["Event name must contain alphanumeric characters."] } };
  }

  const existingEvent = await prisma.event.findUnique({
    where: { seasonId_slug: { seasonId, slug } },
  });
  if (existingEvent) {
    return { error: { name: ["An event with this name or slug already exists in this season."] } };
  }

  let parsedConfig: object = {};
  if (config && config.trim().length > 0) {
    try {
      parsedConfig = JSON.parse(config);
    } catch {
      return { error: { config: ["Invalid JSON"] } };
    }
  }

  let event;
  try {
    event = await prisma.event.create({
      data: {
        seasonId,
        name,
        slug,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        isActive: isActive ?? false,
        config: parsedConfig,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: { name: ["An event with this name or slug already exists in this season."] } };
    }
    throw error;
  }

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
  if (parsed.data.config && parsed.data.config.trim().length > 0) {
    try {
      parsedConfig = JSON.parse(parsed.data.config);
    } catch {
      return { error: { config: ["Invalid JSON"] } };
    }
  }

  let after;
  try {
    after = await prisma.event.update({
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: { name: ["An event with this name or slug already exists in this season."] } };
    }
    throw error;
  }

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
