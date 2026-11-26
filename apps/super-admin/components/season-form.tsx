"use client";

import { useState } from "react";
import Link from "next/link";

interface SeasonFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: {
    name?: string;
    codingStartsAt?: Date | string | null;
    codingEndsAt?: Date | string | null;
    isActive?: boolean;
    scoringRules?: unknown;
  };
}

export function SeasonForm({ action, defaultValues }: SeasonFormProps) {
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const defaultStart = defaultValues?.codingStartsAt
    ? new Date(defaultValues.codingStartsAt).toISOString().split("T")[0]
    : "";
  const defaultEnd = defaultValues?.codingEndsAt
    ? new Date(defaultValues.codingEndsAt).toISOString().split("T")[0]
    : "";
  const defaultConfigStr = defaultValues?.scoringRules
    ? JSON.stringify(defaultValues.scoringRules, null, 2)
    : "{\n  \"levels\": {\n    \"BEGINNER\": 10,\n    \"INTERMEDIATE\": 25,\n    \"ADVANCED\": 50\n  }\n}";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors({});
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    if (result && result.error) {
      setErrors(result.error);
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel max-w-xl space-y-5 p-6">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
          Season Name
        </label>
        <input
          name="name"
          defaultValue={defaultValues?.name || ""}
          required
          placeholder="e.g. Mergio 2026"
          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "var(--text)",
            border: "1px solid var(--border-strong)",
          }}
        />
        {errors.name && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.name.join(", ")}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
            Start Date
          </label>
          <input
            type="date"
            name="startsAt"
            defaultValue={defaultStart}
            required
            className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
            }}
          />
          {errors.startsAt && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.startsAt.join(", ")}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
            End Date
          </label>
          <input
            type="date"
            name="endsAt"
            defaultValue={defaultEnd}
            required
            className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none"
            style={{
              backgroundColor: "var(--surface-2)",
              color: "var(--text)",
              border: "1px solid var(--border-strong)",
            }}
          />
          {errors.endsAt && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.endsAt.join(", ")}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          defaultChecked={defaultValues?.isActive || false}
          className="h-4 w-4 rounded"
        />
        <label htmlFor="isActive" className="text-xs font-medium cursor-pointer" style={{ color: "var(--text)" }}>
          Mark as Active Season (displayed on participant portal & leaderboard)
        </label>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--dim)" }}>
          Scoring Rules & Season Configuration (JSON)
        </label>
        <textarea
          name="config"
          rows={6}
          defaultValue={defaultConfigStr}
          className="mt-1.5 w-full rounded-xl p-3 font-mono text-xs focus:outline-none"
          style={{
            backgroundColor: "var(--surface-2)",
            color: "var(--text)",
            border: "1px solid var(--border-strong)",
          }}
        />
        {errors.config && <p className="mt-1 text-xs" style={{ color: "var(--red)" }}>{errors.config.join(", ")}</p>}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="btn-ice disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Season"}
        </button>
        <Link
          href="/seasons"
          className="btn-secondary"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
