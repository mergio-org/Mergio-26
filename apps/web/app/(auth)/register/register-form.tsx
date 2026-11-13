"use client";

import { useActionState, useState, useTransition } from "react";
import { links } from "@/lib/content";
import {
  ROLES,
  roleInfo,
  type RegistrationState,
  type RoleName,
} from "@/lib/registration";
import { registerAction } from "../actions";

const GRADUATION_YEARS = [2025, 2026, 2027, 2028, 2029, 2030, 2031];

export function RegisterForm({
  defaults,
  heldRoles,
  preselect,
  hasProfile,
}: {
  defaults: {
    college: string;
    graduationYear: string;
    phone: string;
    discord: string;
    updatesOptIn: boolean;
  };
  heldRoles: RoleName[];
  preselect: RoleName | null;
  hasProfile: boolean;
}) {
  const [state, formAction, pending] = useActionState<RegistrationState, FormData>(
    registerAction,
    {},
  );
  const [submitting, startTransition] = useTransition();
  const errors = state.errors ?? {};

  const [selected, setSelected] = useState<RoleName[]>(() =>
    preselect && !heldRoles.includes(preselect) ? [preselect] : [],
  );
  const toggle = (role: RoleName) =>
    setSelected((current) =>
      current.includes(role) ? current.filter((r) => r !== role) : [...current, role],
    );

  const allHeld = ROLES.every((role) => heldRoles.includes(role));

  // Submitting through onSubmit instead of <form action> stops React from resetting the form
  // after a failed validation, which would clear the checkboxes and lose the person's focus.
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

      <fieldset className="role-set">
        <legend>How do you want to take part?</legend>
        <div className="role-grid">
          {ROLES.map((role) => {
            const held = heldRoles.includes(role);
            const checked = held || selected.includes(role);
            return (
              <label key={role} className={`role-card${checked ? " on" : ""}${held ? " held" : ""}`}>
                <input
                  type="checkbox"
                  name="role"
                  value={role}
                  checked={checked}
                  disabled={held}
                  onChange={() => toggle(role)}
                />
                <span className="role-name">{roleInfo[role].label}</span>
                <span className="role-blurb">{roleInfo[role].blurb}</span>
                <span className="role-review">{held ? "Already registered" : roleInfo[role].review}</span>
              </label>
            );
          })}
        </div>
        {errors.roles && <p className="field-error">{errors.roles}</p>}
        {allHeld && <p className="field-hint">You are registered for every role.</p>}
      </fieldset>

      {selected.includes("MAINTAINER") && (
        <div className="field">
          <label htmlFor="repoUrl">
            Your repository <span className="opt">optional</span>
          </label>
          <input
            id="repoUrl"
            name="repoUrl"
            type="url"
            inputMode="url"
            placeholder="https://github.com/owner/repo"
            defaultValue=""
            aria-invalid={Boolean(errors.repoUrl)}
            aria-describedby={errors.repoUrl ? "repoUrl-err" : undefined}
          />
          {errors.repoUrl ? (
            <p className="field-error" id="repoUrl-err">{errors.repoUrl}</p>
          ) : (
            <p className="field-hint">You can submit projects properly later. This just helps us plan.</p>
          )}
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="college">College or university</label>
          <input
            id="college"
            name="college"
            autoComplete="organization"
            defaultValue={defaults.college}
            aria-invalid={Boolean(errors.college)}
            aria-describedby={errors.college ? "college-err" : undefined}
          />
          {errors.college && <p className="field-error" id="college-err">{errors.college}</p>}
        </div>
        <div className="field">
          <label htmlFor="graduationYear">Graduation year</label>
          <select
            id="graduationYear"
            name="graduationYear"
            defaultValue={defaults.graduationYear}
            aria-invalid={Boolean(errors.graduationYear)}
            aria-describedby={errors.graduationYear ? "year-err" : undefined}
          >
            <option value="">Select</option>
            {GRADUATION_YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          {errors.graduationYear && <p className="field-error" id="year-err">{errors.graduationYear}</p>}
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="phone">
            Phone <span className="opt">optional</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            defaultValue={defaults.phone}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-err" : undefined}
          />
          {errors.phone && <p className="field-error" id="phone-err">{errors.phone}</p>}
        </div>
        <div className="field">
          <label htmlFor="discord">
            Discord username <span className="opt">optional</span>
          </label>
          <input
            id="discord"
            name="discord"
            autoComplete="off"
            defaultValue={defaults.discord}
            aria-invalid={Boolean(errors.discord)}
            aria-describedby={errors.discord ? "discord-err" : undefined}
          />
          {errors.discord && <p className="field-error" id="discord-err">{errors.discord}</p>}
        </div>
      </div>

      <div className="consent">
        <label className="check">
          <input type="checkbox" name="codeOfConduct" defaultChecked={hasProfile} />
          <span>
            I accept the{" "}
            <a href={links.codeOfConduct} target="_blank" rel="noreferrer">
              code of conduct
            </a>
            .
          </span>
        </label>
        {errors.codeOfConduct && <p className="field-error">{errors.codeOfConduct}</p>}
        <label className="check">
          <input type="checkbox" name="updatesOptIn" defaultChecked={defaults.updatesOptIn} />
          <span>Email me when Mergio opens and about important dates.</span>
        </label>
      </div>

      <button className="btn btn-primary" type="submit" disabled={pending || submitting || allHeld}>
        {pending || submitting ? "Saving…" : hasProfile ? "Save and add roles" : "Complete registration"}
      </button>
    </form>
  );
}
