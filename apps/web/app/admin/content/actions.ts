"use server";

import { revalidatePath } from "next/cache";
import {
  createItem,
  deleteItem,
  importDefaults,
  listItems,
  reorderItems,
  resetPage,
  savePage,
  updateItem,
  type ContentResult,
} from "@/lib/content-service";
import { getSession } from "@/lib/dal";
import { parseKind, parsePageSlug } from "@/lib/site-content";

// Server actions for /admin/content. The content service checks the organizer role itself.

export type ContentActionResult = { error?: string; errors?: Record<string, string>; done?: string };

async function run<T>(
  work: (user: NonNullable<Awaited<ReturnType<typeof getSession>>>["user"]) => Promise<ContentResult<T>>,
  done: string,
): Promise<ContentActionResult> {
  const session = await getSession();
  if (!session) return { error: "Your session expired. Sign in with GitHub again." };
  const result = await work(session.user);
  if (!result.ok) return { error: result.message, errors: result.errors };
  // The public pages and this console both show the change straight away.
  revalidatePath("/", "layout");
  return { done };
}

const badKind = { error: "Unknown content kind." };

export async function saveItemAction(
  kindValue: string,
  id: string | null,
  data: Record<string, unknown>,
): Promise<ContentActionResult> {
  const kind = parseKind(kindValue);
  if (!kind) return badKind;
  return run((user) => (id ? updateItem(user, kind, id, data) : createItem(user, kind, data)), id ? "Saved." : "Added.");
}

export async function deleteItemAction(kindValue: string, id: string): Promise<ContentActionResult> {
  const kind = parseKind(kindValue);
  if (!kind) return badKind;
  return run((user) => deleteItem(user, kind, id), "Deleted.");
}

export async function moveItemAction(kindValue: string, id: string, direction: -1 | 1): Promise<ContentActionResult> {
  const kind = parseKind(kindValue);
  if (!kind) return badKind;
  const ids = (await listItems(kind)).map((item) => item.id);
  const from = ids.indexOf(id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= ids.length) return {};
  [ids[from], ids[to]] = [ids[to]!, ids[from]!];
  return run((user) => reorderItems(user, kind, ids), "Moved.");
}

export async function importDefaultsAction(kindValue: string): Promise<ContentActionResult> {
  const kind = parseKind(kindValue);
  if (!kind) return badKind;
  return run((user) => importDefaults(user, kind), "Imported. You can edit the items now.");
}

export async function savePageAction(slugValue: string, data: Record<string, unknown>): Promise<ContentActionResult> {
  const slug = parsePageSlug(slugValue);
  if (!slug) return { error: "Unknown page." };
  return run((user) => savePage(user, slug, data), "Published.");
}

export async function resetPageAction(slugValue: string): Promise<ContentActionResult> {
  const slug = parsePageSlug(slugValue);
  if (!slug) return { error: "Unknown page." };
  return run((user) => resetPage(user, slug), "Reset to the built-in copy.");
}
