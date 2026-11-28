"use client";

import { banUser, unbanUser } from "@/app/users/actions";
import { useState } from "react";
import { ShieldBan, ShieldCheck } from "lucide-react";

export function BanButton({
  userId,
  isBanned,
  banReason,
}: {
  userId: string;
  isBanned: boolean;
  banReason: string | null;
}) {
  const [showForm, setShowForm] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUnban() {
    setPending(true);
    await unbanUser(userId);
    setPending(false);
  }

  async function handleBan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("userId", userId);
    const result = await banUser(fd);
    if (result?.error) {
      setError(Object.values(result.error).flat().join(", "));
    } else {
      setShowForm(false);
    }
    setPending(false);
  }

  if (isBanned) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {banReason && (
          <p className="text-xs italic" style={{ color: "var(--dim)" }}>
            Reason: {banReason}
          </p>
        )}
        <button
          onClick={handleUnban}
          disabled={pending}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
          style={{
            backgroundColor: "rgba(91, 212, 154, 0.15)",
            color: "var(--green)",
            border: "1px solid rgba(91, 212, 154, 0.3)",
          }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {pending ? "Unbanning…" : "Lift Ban"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition"
          style={{
            backgroundColor: "rgba(255, 107, 107, 0.15)",
            color: "var(--red)",
            border: "1px solid rgba(255, 107, 107, 0.3)",
          }}
        >
          <ShieldBan className="h-3.5 w-3.5" />
          Ban User
        </button>
      )}
      {showForm && (
        <form
          onSubmit={handleBan}
          className="panel w-80 p-4 shadow-xl"
          style={{ borderColor: "rgba(255, 107, 107, 0.35)" }}
        >
          <p className="mb-2 text-xs font-semibold" style={{ color: "var(--red)" }}>
            Account Suspension
          </p>
          <input type="hidden" name="userId" value={userId} />
          <textarea
            name="reason"
            rows={2}
            required
            placeholder="Mandatory reason for audit trail..."
            className="w-full rounded-lg p-2.5 text-xs focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border)",
            }}
          />
          {error && (
            <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>
              {error}
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
              style={{
                backgroundColor: "var(--red)",
                color: "#FFFFFF",
              }}
            >
              {pending ? "Suspending…" : "Confirm Ban"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg px-3 py-1.5 text-xs transition"
              style={{ color: "var(--dim)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
