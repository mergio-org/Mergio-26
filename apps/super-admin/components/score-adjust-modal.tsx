"use client";

import { useState } from "react";
import { createManualScoreAdjustment } from "@/app/scores/actions";
import { PlusCircle, X, Sparkles } from "lucide-react";

interface UserOption {
  id: string;
  name: string;
  email: string;
  githubLogin: string | null;
}

interface SeasonOption {
  id: string;
  name: string;
  isActive: boolean;
  events: { id: string; name: string }[];
}

interface Props {
  users: UserOption[];
  seasons: SeasonOption[];
}

export function ScoreAdjustModal({ users, seasons }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(
    seasons.find((s) => s.isActive)?.id || seasons[0]?.id || ""
  );
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const currentSeason = seasons.find((s) => s.id === selectedSeasonId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    setGeneralError(null);

    const formData = new FormData(e.currentTarget);
    const res = await createManualScoreAdjustment(formData);

    if (res?.error) {
      setErrors(res.error);
      setPending(false);
    } else {
      setPending(false);
      setIsOpen(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-ice"
      >
        <PlusCircle className="h-4 w-4" />
        Manual Score Adjustment
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60">
          <div
            className="panel relative w-full max-w-lg p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: "var(--ice)" }} />
                <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
                  Manual Score Adjustment
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="transition hover:opacity-75"
                style={{ color: "var(--dim)" }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {generalError && (
              <div
                className="mt-3 rounded-lg p-2.5 text-xs"
                style={{
                  backgroundColor: "rgba(255, 107, 107, 0.15)",
                  color: "var(--red)",
                }}
              >
                {generalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                  Select User <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <select
                  name="userId"
                  required
                  className="mt-1 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text)",
                    border: "1px solid var(--border-strong)",
                  }}
                >
                  <option value="">-- Choose User --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email}) {u.githubLogin ? `[@${u.githubLogin}]` : ""}
                    </option>
                  ))}
                </select>
                {errors.userId && (
                  <p className="mt-1" style={{ color: "var(--red)" }}>{errors.userId.join(", ")}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                    Season <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <select
                    name="seasonId"
                    value={selectedSeasonId}
                    onChange={(e) => setSelectedSeasonId(e.target.value)}
                    required
                    className="mt-1 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    {seasons.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isActive ? "(Active)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                    Event (Optional)
                  </label>
                  <select
                    name="eventId"
                    className="mt-1 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text)",
                      border: "1px solid var(--border-strong)",
                    }}
                  >
                    <option value="">Season-level</option>
                    {currentSeason?.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                    Delta <span style={{ color: "var(--red)" }}>*</span>
                  </label>
                  <input
                    type="number"
                    name="delta"
                    required
                    placeholder="+25 or -10"
                    className="mt-1 w-full rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text)",
                      border: "1px solid var(--border-strong)",
                    }}
                  />
                  {errors.delta && (
                    <p className="mt-1" style={{ color: "var(--red)" }}>{errors.delta.join(", ")}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                    PR # (Optional)
                  </label>
                  <input
                    type="number"
                    name="prNumber"
                    placeholder="e.g. 42"
                    className="mt-1 w-full rounded-xl px-3 py-2.5 font-mono focus:outline-none"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text)",
                      border: "1px solid var(--border-strong)",
                    }}
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                    Repo (Optional)
                  </label>
                  <input
                    type="text"
                    name="repoFullName"
                    placeholder="org/repo"
                    className="mt-1 w-full rounded-xl px-3 py-2.5 focus:outline-none"
                    style={{
                      backgroundColor: "var(--surface-2)",
                      color: "var(--text)",
                      border: "1px solid var(--border-strong)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
                  Mandatory Audit Reason <span style={{ color: "var(--red)" }}>*</span>
                </label>
                <textarea
                  name="reason"
                  rows={2}
                  required
                  placeholder="Justification for this manual score adjustment (recorded in audit log)..."
                  className="mt-1 w-full rounded-xl p-3 focus:outline-none"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    color: "var(--text)",
                    border: "1px solid var(--border-strong)",
                  }}
                />
                {errors.reason && (
                  <p className="mt-1" style={{ color: "var(--red)" }}>{errors.reason.join(", ")}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-ice text-xs disabled:opacity-50"
                >
                  {pending ? "Applying..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
