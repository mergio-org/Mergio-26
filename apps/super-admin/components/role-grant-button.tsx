"use client";

import { grantRole } from "@/app/users/actions";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

const ALL_ROLES = ["CONTRIBUTOR", "MAINTAINER", "MENTOR"] as const;

export function RoleGrantButton({
  userId,
  existingRoles,
}: {
  userId: string;
  existingRoles: string[];
}) {
  const available = ALL_ROLES.filter((r) => !existingRoles.includes(r));
  const [pending, setPending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  if (available.length === 0) return null;

  async function handleGrant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    fd.set("userId", userId);
    await grantRole(fd);
    setPending(false);
    setShowForm(false);
  }

  return (
    <div>
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: "var(--ice)" }}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Grant a role
        </button>
      )}
      {showForm && (
        <form onSubmit={handleGrant} className="mt-2 flex items-center gap-2">
          <select
            name="role"
            className="rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
            }}
          >
            {available.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--ice)",
              color: "#0B0D12",
            }}
          >
            {pending ? "Granting…" : "Confirm"}
          </button>
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="text-xs"
            style={{ color: "var(--dim)" }}
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
}
