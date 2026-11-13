import { prisma } from "@repo/db";
import type { Metadata } from "next";
import type { IconName } from "@/components/landing/icon";
import { Icon } from "@/components/landing/icon";
import { getSession } from "@/lib/dal";
import { ROLES, parseRole, roleInfo, type RoleName } from "@/lib/registration";
import { signInWithGitHub, signOutAction } from "../actions";
import { RegisterForm } from "./register-form";
import { GdgLogo } from "@/components/landing/gdg-logo";

export const metadata: Metadata = {
  title: "Register — Mergio",
  description: "Sign in with GitHub and register for Mergio.",
};

const ROLE_ICONS: Record<RoleName, IconName> = {
  CONTRIBUTOR: "pr",
  MAINTAINER: "repo",
  MENTOR: "mentor",
};

const JOIN_FACTS: { icon: IconName; text: string }[] = [
  { icon: "calendar", text: "One month of contributions, free to join" },
  { icon: "clock", text: "Mentors review your pull requests within 48 hours" },
  { icon: "award", text: "A certificate for every merged pull request" },
];

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const preselect = parseRole((await searchParams).role);
  const session = await getSession();

  if (!session) {
    return (
      <div className="join">
        <section className="join-pitch">
          <GdgLogo className="join-logo" />
          <h1>
            Join Mergio <span>this winter.</span>
          </h1>
          <p className="auth-lead">
            A month of real open-source work, with mentors by your side and a
            leaderboard that counts every merge. Sign in to save your spot.
          </p>
          <ul className="join-facts">
            {JOIN_FACTS.map((fact) => (
              <li key={fact.text}>
                <span className="tile-icon">
                  <Icon name={fact.icon} size={18} />
                </span>
                {fact.text}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="join-card panel panel-featured"
          aria-labelledby="join-title"
        >
          <span className="join-step">Step 1 of 2 · Sign in</span>
          <h2 id="join-title">How do you want to take part?</h2>
          <form action={signInWithGitHub} className="join-form">
            <fieldset className="join-roles">
              <legend className="sr-only">Choose a role</legend>
              {ROLES.map((role) => (
                <label key={role} className="join-role">
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    defaultChecked={role === (preselect ?? "CONTRIBUTOR")}
                  />
                  <span className="tile-icon">
                    <Icon name={ROLE_ICONS[role]} size={18} />
                  </span>
                  <span className="join-role-text">
                    <b>{roleInfo[role].label}</b>
                    <span>{roleInfo[role].blurb}</span>
                  </span>
                  <span className="join-radio" aria-hidden="true" />
                </label>
              ))}
            </fieldset>
            <p className="join-hint">
              You can add more roles after you sign in.
            </p>
            <button className="btn btn-primary join-submit" type="submit">
              <Icon name="github" size={18} />
              Continue with GitHub
            </button>
          </form>
          <p className="join-privacy">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            We only read your public profile and email. Never your repositories.
          </p>
        </section>
      </div>
    );
  }

  const { user } = session;
  const [profile, registrations] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.registration.findMany({
      where: { userId: user.id },
      select: { role: true },
    }),
  ]);

  return (
    <section className="auth-card panel">
      <div className="auth-user">
        {/* eslint-disable-next-line @next/next/no-img-element -- remote GitHub avatar, no loader configured */}
        {user.image && <img src={user.image} alt="" width={44} height={44} />}
        <div>
          <b>{user.name}</b>
          <span>@{user.githubLogin}</span>
        </div>
        <form action={signOutAction}>
          <button className="btn btn-ghost btn-sm" type="submit">
            Sign out
          </button>
        </form>
      </div>
      <h1>
        {registrations.length
          ? "Add another role"
          : "Complete your registration"}
      </h1>
      <RegisterForm
        defaults={{
          college: profile?.college ?? "",
          graduationYear: profile ? String(profile.graduationYear) : "",
          phone: profile?.phone ?? "",
          discord: profile?.discord ?? "",
          updatesOptIn: profile?.updatesOptIn ?? false,
        }}
        heldRoles={registrations.map((registration) => registration.role)}
        preselect={preselect}
        hasProfile={Boolean(profile)}
      />
    </section>
  );
}
