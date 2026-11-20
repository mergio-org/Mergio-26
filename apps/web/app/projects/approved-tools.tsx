"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import type { ProjectFormState } from "@/lib/projects";
import type { RepoActionState } from "./actions";

function Problems({ problems }: { problems?: Record<string, string[]> }) {
  const entries = Object.entries(problems ?? {});
  if (!entries.length) return null;
  return (
    <ul className="m-0 list-none space-y-2 p-0" aria-label="Repo problems">
      {entries.map(([repo, list]) => (
        <li
          key={repo}
          className="rounded-[10px] border border-(color:--border-strong) px-3.5 py-2.5 text-sm"
        >
          <b className="font-mono font-medium">{repo}</b>
          <ul className="mt-1 mb-0 list-disc space-y-0.5 pl-5 text-(color:--gold)">
            {list.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/** After approval: the description and tech stack are all the project admin can change. */
export function ApprovedDetailsForm({
  action,
  description,
  techStack,
}: {
  action: (
    state: ProjectFormState,
    formData: FormData,
  ) => Promise<ProjectFormState>;
  description: string;
  techStack: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [submitting, startTransition] = useTransition();
  const errors = state.errors ?? {};

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      {errors.form && (
        <p className="form-alert" role="alert">
          {errors.form}
        </p>
      )}
      {state.saved && (
        <p
          className="form-alert border-(color:--green)! text-(color:--green)!"
          role="status"
        >
          Saved.
        </p>
      )}
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={description}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? "description-err" : "description-hint"
          }
        />
        {errors.description ? (
          <p className="field-error" id="description-err">
            {errors.description}
          </p>
        ) : (
          <p className="field-hint" id="description-hint">
            Markdown works.
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor="techStack">Tech stack</label>
        <input
          id="techStack"
          name="techStack"
          defaultValue={techStack}
          aria-invalid={Boolean(errors.techStack)}
          aria-describedby={
            errors.techStack ? "techStack-err" : "techStack-hint"
          }
        />
        {errors.techStack ? (
          <p className="field-error" id="techStack-err">
            {errors.techStack}
          </p>
        ) : (
          <p className="field-hint" id="techStack-hint">
            Comma separated, up to 10.
          </p>
        )}
      </div>
      <button
        className="btn btn-primary self-start"
        type="submit"
        disabled={pending || submitting}
      >
        {pending || submitting ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

/** Adds a repo; on an approved project it then waits for an organizer. */
export function AddRepoForm({
  action,
}: {
  action: (
    state: RepoActionState,
    formData: FormData,
  ) => Promise<RepoActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [submitting, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.done) form.current?.reset();
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form
      ref={form}
      onSubmit={onSubmit}
      className="flex flex-col gap-3"
      noValidate
    >
      {state.error && (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      )}
      {state.done && (
        <p
          className="form-alert border-(color:--green)! text-(color:--green)!"
          role="status"
        >
          {state.done}
        </p>
      )}
      <Problems problems={state.repoProblems} />
      <div className="field">
        <label htmlFor="repo">Add a repo</label>
        <div className="flex flex-wrap gap-2">
          <input
            id="repo"
            name="repo"
            type="url"
            inputMode="url"
            placeholder="https://github.com/owner/repo"
            className="min-w-0 flex-1 basis-64"
          />
          <button
            className="btn btn-ghost"
            type="submit"
            disabled={pending || submitting}
          >
            {pending || submitting ? "Checking on GitHub…" : "Add repo"}
          </button>
        </div>
        <p className="field-hint">
          It must pass every check, and an organizer approves it before it
          counts.
        </p>
      </div>
    </form>
  );
}

/** Removes a repo after confirming. Earned points stay; future scoring stops. */
export function RemoveRepoButton({
  action,
  label,
}: {
  action: () => Promise<RepoActionState>;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Remove ${label}? Points already earned stay, but new contributions to it won't count.`,
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex flex-col items-end gap-1"
    >
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Removing…" : "Remove"}
      </button>
      {state.error && (
        <p
          className="m-0 max-w-64 text-right text-xs text-[#E5484D]"
          role="alert"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}

/** Copies an earlier season's project into this season as a new draft. */
export function CopyProjectButton({
  action,
  season,
}: {
  action: () => Promise<RepoActionState>;
  season: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <button className="btn btn-ghost btn-sm" type="submit" disabled={pending}>
        {pending ? "Copying…" : `Copy to ${season}`}
      </button>
      {state.error && (
        <p
          className="m-0 max-w-72 text-right text-xs text-[#E5484D]"
          role="alert"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}
