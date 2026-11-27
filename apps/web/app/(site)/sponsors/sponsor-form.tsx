"use client";

import { useActionState } from "react";
import { sponsorInquiryAction, type InquiryState } from "./actions";

const FIELDS = [
  { name: "name", label: "Your name", type: "text", autoComplete: "name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "organization", label: "Organization", type: "text", autoComplete: "organization" },
] as const;

export function SponsorForm() {
  const [state, action, pending] = useActionState<InquiryState, FormData>(sponsorInquiryAction, {});

  if (state.done) {
    return (
      <p role="status" className="m-0 font-medium">
        Thanks! We&apos;ve got your message and will get back to you soon.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && !state.errors && (
        <p className="form-alert" role="alert">
          {state.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        {FIELDS.map((field) => (
          <div className="field" key={field.name}>
            <label htmlFor={`sp-${field.name}`}>{field.label}</label>
            <input
              id={`sp-${field.name}`}
              name={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              required
              aria-invalid={state.errors?.[field.name] ? true : undefined}
            />
            {state.errors?.[field.name] && <p className="field-error">{state.errors[field.name]}</p>}
          </div>
        ))}
      </div>
      <div className="field">
        <label htmlFor="sp-message">How would you like to support Mergio?</label>
        <textarea id="sp-message" name="message" rows={4} required aria-invalid={state.errors?.message ? true : undefined} />
        {state.errors?.message && <p className="field-error">{state.errors.message}</p>}
      </div>
      <div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Sending…" : "Send"}
        </button>
      </div>
    </form>
  );
}
