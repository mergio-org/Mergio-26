import "server-only";
import { prisma, type Prisma } from "@repo/db";
import { cache } from "react";
import { isOrganizer } from "./roles";
import {
  CONTENT_KINDS,
  DEFAULT_ITEMS,
  DEFAULT_PAGES,
  validateItem,
  validatePage,
  type ContentData,
  type ContentItemJson,
  type ContentKindKey,
  type PageContent,
  type PageSlug,
} from "./site-content";

// Reads and writes for the editable public-site content (F-16). Every write checks that the
// actor is an organizer itself, so API routes and server actions share the same rules.
// Public pages read on every request (they are dynamic), so a saved change is live immediately.

type Actor = { id: string; staffRole?: unknown; isAdmin?: unknown; isSuperAdmin?: unknown };

export type ContentResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

const fail = (status: number, message: string, errors?: Record<string, string>): ContentResult<never> => ({
  ok: false,
  status,
  message,
  ...(errors ? { errors } : {}),
});

type Row = { id: string; kind: string; position: number; data: Prisma.JsonValue; updatedAt: Date };

function itemJson<K extends ContentKindKey>(kind: K, row: Row): ContentItemJson<K> {
  return {
    id: row.id,
    kind,
    position: row.position,
    data: row.data as ContentData[K],
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Every stored item of a kind, in display order. */
export async function listItems<K extends ContentKindKey>(kind: K): Promise<ContentItemJson<K>[]> {
  const rows = await prisma.contentItem.findMany({
    where: { kind: CONTENT_KINDS[kind].db },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });
  return rows.map((row) => itemJson(kind, row));
}

/**
 * What the public site shows for a kind: the stored items, or the built-in copy when there are
 * none yet. Deduplicated within one request.
 */
export const getPublicItems = cache(async <K extends ContentKindKey>(kind: K): Promise<ContentData[K][]> => {
  const items = await listItems(kind);
  return items.length ? items.map((item) => item.data) : DEFAULT_ITEMS[kind];
});

export async function getItem(kind: ContentKindKey, id: string): Promise<ContentResult<ContentItemJson>> {
  const row = await prisma.contentItem.findFirst({ where: { id, kind: CONTENT_KINDS[kind].db } });
  return row ? { ok: true, data: itemJson(kind, row) } : fail(404, "No item with that ID.");
}

export async function createItem(
  actor: Actor,
  kind: ContentKindKey,
  input: Record<string, unknown>,
): Promise<ContentResult<ContentItemJson>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  const result = validateItem(kind, input);
  if (!result.ok) return fail(400, "Fix the highlighted fields.", result.errors);
  const last = await prisma.contentItem.findFirst({
    where: { kind: CONTENT_KINDS[kind].db },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const row = await prisma.contentItem.create({
    data: {
      kind: CONTENT_KINDS[kind].db,
      position: (last?.position ?? -1) + 1,
      data: result.data as Prisma.InputJsonObject,
      updatedById: actor.id,
    },
  });
  return { ok: true, data: itemJson(kind, row) };
}

/** Replaces an item's data. Fields left out of `input` keep their current value. */
export async function updateItem(
  actor: Actor,
  kind: ContentKindKey,
  id: string,
  input: Record<string, unknown>,
): Promise<ContentResult<ContentItemJson>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  const current = await getItem(kind, id);
  if (!current.ok) return current;
  const merged = { ...(current.data.data as Record<string, unknown>), ...input };
  const result = validateItem(kind, merged);
  if (!result.ok) return fail(400, "Fix the highlighted fields.", result.errors);
  const row = await prisma.contentItem.update({
    where: { id },
    data: { data: result.data as Prisma.InputJsonObject, updatedById: actor.id },
  });
  return { ok: true, data: itemJson(kind, row) };
}

export async function deleteItem(
  actor: Actor,
  kind: ContentKindKey,
  id: string,
): Promise<ContentResult<{ deleted: true }>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  const { count } = await prisma.contentItem.deleteMany({ where: { id, kind: CONTENT_KINDS[kind].db } });
  return count ? { ok: true, data: { deleted: true } } : fail(404, "No item with that ID.");
}

/** Sets the display order. `ids` must list every item of the kind exactly once. */
export async function reorderItems(
  actor: Actor,
  kind: ContentKindKey,
  ids: unknown,
): Promise<ContentResult<ContentItemJson[]>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
    return fail(400, "ids must be an array of item IDs.");
  }
  const existing = await listItems(kind);
  const known = new Set(existing.map((item) => item.id));
  if (ids.length !== known.size || new Set(ids).size !== ids.length || !ids.every((id) => known.has(id))) {
    return fail(400, "ids must list every item of this kind exactly once.");
  }
  await prisma.$transaction(
    (ids as string[]).map((id, position) => prisma.contentItem.update({ where: { id }, data: { position } })),
  );
  return { ok: true, data: await listItems(kind) };
}

/** Copies the built-in copy into the database so organizers can edit it. Only when the kind is empty. */
export async function importDefaults(
  actor: Actor,
  kind: ContentKindKey,
): Promise<ContentResult<ContentItemJson[]>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  const defaults = DEFAULT_ITEMS[kind];
  if (!defaults.length) return fail(400, "There is no built-in copy for this section.");
  const count = await prisma.contentItem.count({ where: { kind: CONTENT_KINDS[kind].db } });
  if (count) return fail(409, "This section already has items.");
  await prisma.contentItem.createMany({
    data: defaults.map((data, position) => ({
      kind: CONTENT_KINDS[kind].db,
      position,
      data: data as Prisma.InputJsonObject,
      updatedById: actor.id,
    })),
  });
  return { ok: true, data: await listItems(kind) };
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

/** A page as stored, or its built-in copy (updatedAt null) if it was never saved. */
export const getPage = cache(async (slug: PageSlug): Promise<PageContent> => {
  const row = await prisma.contentPage.findUnique({ where: { slug } });
  if (!row) return { slug, ...DEFAULT_PAGES[slug], updatedAt: null };
  return {
    slug,
    title: row.title,
    description: row.description,
    body: row.body,
    updatedAt: row.updatedAt.toISOString(),
  };
});

export async function savePage(
  actor: Actor,
  slug: PageSlug,
  input: Record<string, unknown>,
): Promise<ContentResult<PageContent>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  const current = await getPage(slug);
  const result = validatePage({ title: current.title, description: current.description, body: current.body, ...input });
  if (!result.ok) return fail(400, "Fix the highlighted fields.", result.errors);
  const row = await prisma.contentPage.upsert({
    where: { slug },
    create: { slug, ...result.data, updatedById: actor.id },
    update: { ...result.data, updatedById: actor.id },
  });
  return { ok: true, data: { slug, ...result.data, updatedAt: row.updatedAt.toISOString() } };
}

/** Deletes the stored page so the built-in copy shows again. */
export async function resetPage(actor: Actor, slug: PageSlug): Promise<ContentResult<PageContent>> {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can edit site content.");
  await prisma.contentPage.deleteMany({ where: { slug } });
  return { ok: true, data: { slug, ...DEFAULT_PAGES[slug], updatedAt: null } };
}

// ---------------------------------------------------------------------------
// Sponsor inquiries ("Become a sponsor" on /sponsors)
// ---------------------------------------------------------------------------

const INQUIRY_LIMITS = { name: 100, email: 254, organization: 120, message: 2000 };

export async function createSponsorInquiry(
  input: Record<string, unknown>,
): Promise<ContentResult<{ id: string }>> {
  const errors: Record<string, string> = {};
  const text = (name: keyof typeof INQUIRY_LIMITS, label: string) => {
    const raw = input[name];
    const value = typeof raw === "string" ? raw.trim() : "";
    if (!value) errors[name] = `${label} is required.`;
    else if (value.length > INQUIRY_LIMITS[name]) errors[name] = `${label} is too long.`;
    return value;
  };
  const data = {
    name: text("name", "Your name"),
    email: text("email", "Email"),
    organization: text("organization", "Organization"),
    message: text("message", "Message"),
  };
  if (data.email && !errors.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (Object.keys(errors).length) return fail(400, "Fix the highlighted fields.", errors);
  // A burst from one address is almost certainly a double submit or a bot.
  const recent = await prisma.sponsorInquiry.count({
    where: { email: data.email, createdAt: { gt: new Date(Date.now() - 10 * 60 * 1000) } },
  });
  if (recent >= 3) return fail(429, "We already have your message. We'll be in touch soon.");
  const row = await prisma.sponsorInquiry.create({ data, select: { id: true } });
  return { ok: true, data: row };
}

export async function listSponsorInquiries(actor: Actor) {
  if (!isOrganizer(actor)) return fail(403, "Only organizers can see sponsor inquiries.");
  const rows = await prisma.sponsorInquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  return { ok: true as const, data: rows };
}
