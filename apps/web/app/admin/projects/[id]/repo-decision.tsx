"use client";


import { useActionState, useId, useTransition } from "react";
import type { ReviewState } from "../actions";


/** Accept or reject one repo added after approval. Rejecting needs a reason the PA will see. */
export function RepoDecisionForm({
  action,
}: {
  action: (state: ReviewState, formData: FormData) => Promise<ReviewState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [submitting, startTransition] = useTransition();
  const busy = pending || submitting;
  const reasonId = useId();


  function decide(
    event: React.MouseEvent<HTMLButtonElement>,
    decision: "accept" | "reject",
  ) {
    const form = event.currentTarget.form;
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    data.set("decision", decision);
    startTransition(() => formAction(data));
  }


  if (state.done) {
    return (
      <p
        className="form-alert mt-3 border-(color:--green)! text-(color:--green)!"
        role="status"
      >
        {state.done}
      </p>
    );
  }
  return (
    <form className="mt-3 flex flex-col gap-2" noValidate>
      {state.error && (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      )}
      <div className="field">
        <label htmlFor={reasonId} className="sr-only">
          Reason (required to reject)
        </label>
        <textarea
          id={reasonId}
          name="reason"
          rows={2}
          placeholder="Reason (required to reject; the project admin sees it)"
        />
      </div>
      <div className="flex gap-2">
        <button
          className="btn btn-primary btn-sm"
          type="submit"
          disabled={busy}
          onClick={(e) => decide(e, "accept")}
        >
          Accept repo
        </button>
