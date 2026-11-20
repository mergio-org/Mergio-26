"use client";

import { useActionState } from "react";
import type { ProjectFormState } from "@/lib/projects";

export function SubmitPanel({
  action,
  resubmit,
}: {
  action: (state: ProjectFormState) => Promise<ProjectFormState>;
  resubmit: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const problems = Object.entries(state.repoProblems ?? {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.errors?.form && (
        <p className="form-alert" role="alert">
          {state.errors.form}
        </p>
      )}
      {problems.length > 0 && (
        <ul className="m-0 list-none space-y-2 p-0" aria-label="Repo problems">
          {problems.map(([repo, list]) => (
            <li key={repo} className="rounded-[10px] border border-(color:--border-strong) px-3.5 py-2.5 text-sm">
              <b className="font-mono font-medium">{repo}</b>
              <ul className="mt-1 mb-0 list-disc space-y-0.5 pl-5 text-(color:--gold)">
                {list.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
      <button className="btn btn-primary self-start" type="submit" disabled={pending}>
        {pending ? "Checking repos on GitHub…" : resubmit ? "Resubmit for review" : "Submit for review"}
      </button>
    </form>
  );
}
