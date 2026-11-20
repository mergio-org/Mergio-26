"use client";

import { useActionState, useTransition } from "react";
import {
  MAX_REPOS,
  OSI_LICENSES,
  type ProjectDefaults,
  type ProjectFormState,
} from "@/lib/projects";

export function ProjectForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  defaults: ProjectDefaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [submitting, startTransition] = useTransition();
  const errors = state.errors ?? {};
  const repoProblems = Object.entries(state.repoProblems ?? {});
  const busy = pending || submitting;

  // Submitting through onSubmit instead of <form action> stops React from resetting the form
  // after a failed validation, which would lose what the person typed.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  const describedBy = (field: keyof NonNullable<ProjectFormState["errors"]>, hint?: string) =>
    errors[field] ? `${field}-err` : hint;

  return (
    <form onSubmit={onSubmit} className="auth-form" noValidate>
      {errors.form && (
        <p className="form-alert" role="alert">
          {errors.form}
        </p>
      )}
      {state.saved && !errors.form && (
        <p className="form-alert border-(color:--green)! text-(color:--green)!" role="status">
          Saved.{repoProblems.length ? " Fix the repo items below before you submit." : ""}
        </p>
      )}

      <div className="field">
        <label htmlFor="name">Project name</label>
        <input
          id="name"
          name="name"
          defaultValue={defaults.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name")}
        />
        {errors.name && <p className="field-error" id="name-err">{errors.name}</p>}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={defaults.description}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={describedBy("description", "description-hint")}
        />
        {errors.description ? (
          <p className="field-error" id="description-err">{errors.description}</p>
        ) : (
          <p className="field-hint" id="description-hint">
            What it does, who it is for and what contributors will work on. Markdown works.
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="repos">GitHub repositories</label>
        <textarea
          id="repos"
          name="repos"
          rows={3}
          placeholder="https://github.com/owner/repo"
          defaultValue={defaults.repos}
          spellCheck={false}
          aria-invalid={Boolean(errors.repos)}
          aria-describedby={describedBy("repos", "repos-hint")}
        />
        {errors.repos ? (
          <p className="field-error" id="repos-err">{errors.repos}</p>
        ) : (
          <p className="field-hint" id="repos-hint">
            One link per line, up to {MAX_REPOS}. Each repo must be public and not archived, with an
            OSI-approved license, a README and a CONTRIBUTING file, and you need admin or maintain
            permission on it.
          </p>
        )}
        {repoProblems.length > 0 && (
          <ul className="mt-3 mb-0 list-none space-y-2 p-0" aria-label="Repo problems">
            {repoProblems.map(([repo, problems]) => (
              <li key={repo} className="rounded-[10px] border border-(color:--border-strong) px-3.5 py-2.5 text-sm">
                <b className="font-mono font-medium">{repo}</b>
                <ul className="mt-1 mb-0 list-disc space-y-0.5 pl-5 text-(color:--gold)">
                  {problems.map((problem) => (
                    <li key={problem}>{problem}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="techStack">Tech stack</label>
          <input
            id="techStack"
            name="techStack"
            placeholder="TypeScript, React, PostgreSQL"
            defaultValue={defaults.techStack}
            aria-invalid={Boolean(errors.techStack)}
            aria-describedby={describedBy("techStack", "techStack-hint")}
          />
          {errors.techStack ? (
            <p className="field-error" id="techStack-err">{errors.techStack}</p>
          ) : (
            <p className="field-hint" id="techStack-hint">Comma separated, up to 10.</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="license">License</label>
          <select
            id="license"
            name="license"
            defaultValue={defaults.license}
            aria-invalid={Boolean(errors.license)}
            aria-describedby={describedBy("license")}
          >
            {OSI_LICENSES.map((license) => (
              <option key={license} value={license}>{license}</option>
            ))}
          </select>
          {errors.license && <p className="field-error" id="license-err">{errors.license}</p>}
        </div>
      </div>

      <fieldset className="role-set">
        <legend>Expected issue levels (%)</legend>
        <div className="field-row">
          {(
            [
              ["difficultyEasy", "Beginner", defaults.difficultyEasy],
              ["difficultyMedium", "Intermediate", defaults.difficultyMedium],
              ["difficultyHard", "Advanced", defaults.difficultyHard],
            ] as const
          ).map(([name, label, value]) => (
            <div className="field" key={name}>
              <label htmlFor={name} className="font-normal! text-(color:--muted)">{label}</label>
              <input
                id={name}
                name={name}
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                defaultValue={value}
                aria-invalid={Boolean(errors.difficultyEasy)}
                aria-describedby={errors.difficultyEasy ? "difficulty-err" : undefined}
              />
            </div>
          ))}
        </div>
        {errors.difficultyEasy && (
          <p className="field-error" id="difficulty-err">{errors.difficultyEasy}</p>
        )}
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label htmlFor="expectedMentors">Mentors you expect to bring</label>
          <input
            id="expectedMentors"
            name="expectedMentors"
            type="number"
            inputMode="numeric"
            min={0}
            max={20}
            defaultValue={defaults.expectedMentors}
            aria-invalid={Boolean(errors.expectedMentors)}
            aria-describedby={describedBy("expectedMentors")}
          />
          {errors.expectedMentors && (
            <p className="field-error" id="expectedMentors-err">{errors.expectedMentors}</p>
          )}
        </div>
        <div className="field">
          <label htmlFor="discordChannel">
            Discord channel <span className="opt">optional</span>
          </label>
          <input
            id="discordChannel"
            name="discordChannel"
            placeholder="#your-project"
            defaultValue={defaults.discordChannel}
            aria-invalid={Boolean(errors.discordChannel)}
            aria-describedby={describedBy("discordChannel")}
          />
          {errors.discordChannel && (
            <p className="field-error" id="discordChannel-err">{errors.discordChannel}</p>
          )}
        </div>
      </div>

      <div className="field">
        <label htmlFor="contributingUrl">
          Contributing guide link <span className="opt">optional</span>
        </label>
        <input
          id="contributingUrl"
          name="contributingUrl"
          type="url"
          inputMode="url"
          placeholder="https://github.com/owner/repo/blob/main/CONTRIBUTING.md"
          defaultValue={defaults.contributingUrl}
          aria-invalid={Boolean(errors.contributingUrl)}
          aria-describedby={describedBy("contributingUrl")}
        />
        {errors.contributingUrl && (
          <p className="field-error" id="contributingUrl-err">{errors.contributingUrl}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="logoUrl">
          Logo image link <span className="opt">optional</span>
        </label>
        <input
          id="logoUrl"
          name="logoUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          defaultValue={defaults.logoUrl}
          aria-invalid={Boolean(errors.logoUrl)}
          aria-describedby={describedBy("logoUrl", "logoUrl-hint")}
        />
        {errors.logoUrl ? (
          <p className="field-error" id="logoUrl-err">{errors.logoUrl}</p>
        ) : (
          <p className="field-hint" id="logoUrl-hint">
            Leave empty to use the GitHub avatar of the first repo&apos;s owner.
          </p>
        )}
      </div>

      <button className="btn btn-primary" type="submit" disabled={busy}>
        {busy ? "Checking repos on GitHub…" : submitLabel}
      </button>
    </form>
  );
}
