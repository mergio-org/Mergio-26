"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ReviewState } from "../actions";

export type Decision = { value: string; label: string; needsReason: boolean };

export function ReviewForm({
  action,
  decisions,
}: {
  action: (state: ReviewState, formData: FormData) => Promise<ReviewState>;
  decisions: Decision[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [submitting, startTransition] = useTransition();
  const [picked, setChoice] = useState(decisions[0]?.value ?? "NOTE");
  // After a decision the project's status moves on and so do the options; fall back to the
  // first one still allowed (the form stays mounted so its confirmation message survives).
  const options = [
    ...decisions,
    { value: "NOTE", label: "Add an internal note only", needsReason: false },
  ];
  const choice = options.some((option) => option.value === picked)
    ? picked
    : options[0]!.value;
  const form = useRef<HTMLFormElement>(null);
  const needsReason =
    decisions.find((d) => d.value === choice)?.needsReason ?? false;
  const busy = pending || submitting;

  // Clear the notes once a decision went through; keep them when it failed.
  useEffect(() => {
    if (state.done) form.current?.reset();
  }, [state]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(() => formAction(data));
  }

  return (
    <form ref={form} onSubmit={onSubmit} className="auth-form" noValidate>
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

      <fieldset className="role-set">
        <legend>Decision</legend>
        <div className="flex flex-col gap-2">
          {options.map((decision) => (
            <label key={decision.value} className="check">
              <input
                type="radio"
                name="decision"
                value={decision.value}
                checked={choice === decision.value}
                onChange={() => setChoice(decision.value)}
              />
              <span>{decision.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {choice !== "NOTE" && (
        <div className="field">
          <label htmlFor="publicReason">
            Message to the project admin{" "}
            <span className="opt">{needsReason ? "required" : "optional"}</span>
          </label>
          <textarea
            id="publicReason"
            name="publicReason"
            rows={4}
            aria-describedby="publicReason-hint"
          />
          <p className="field-hint" id="publicReason-hint">
            They see this on their project page and in the status email.
          </p>
        </div>
      )}

      <div className="field">
        <label htmlFor="internalNote">
          Internal note{" "}
          <span className="opt">
            {choice === "NOTE" ? "required" : "optional"}
          </span>
        </label>
        <textarea
          id="internalNote"
          name="internalNote"
          rows={3}
          aria-describedby="internalNote-hint"
        />
        <p className="field-hint" id="internalNote-hint">
          Only organizers see this.
        </p>
      </div>

      <button
        className="btn btn-primary self-start"
        type="submit"
        disabled={busy}
      >
        {busy ? "Saving…" : choice === "NOTE" ? "Add note" : "Save decision"}
      </button>
    </form>
  );
}
