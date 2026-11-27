import "server-only";
import { revalidatePath } from "next/cache";
import type { ContentResult } from "./content-service";
import { json } from "./rbac";

// Shared bits of the /api/v1/admin/content route handlers.

/** A content service result as a response; validation failures carry `fields`. */
export function contentJson<T>(result: ContentResult<T>, status = 200) {
  if (result.ok) return json(result.data, status);
  return json(
    { error: { message: result.message, ...(result.errors ? { fields: result.errors } : {}) } },
    result.status,
  );
}

/** After a successful write: drop any cached render of the public site so the change shows at once. */
export function publishContent<T>(result: ContentResult<T>) {
  if (result.ok) revalidatePath("/", "layout");
  return result;
}
