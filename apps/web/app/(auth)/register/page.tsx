import { prisma } from "@repo/db";
import type { Metadata } from "next";
import { Icon } from "@/components/landing/icon";
import { getSession } from "@/lib/dal";
import { ROLES, parseRole, roleInfo } from "@/lib/registration";
import { signInWithGitHub, signOutAction } from "../actions";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Register — Mergio",
  description: "Sign in with GitHub and register for Mergio.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const preselect = parseRole((await searchParams).role);
  const session = await getSession();

  if (!session) {
    return (
      <section className="auth-card panel">
        <span className="eyebrow">Register</span>
        <h1>Join Mergio this winter</h1>
        <p className="auth-lead">
          Sign in with GitHub, tell us how you want to take part, and we will be
          in touch when the program begins. We only read your public profile and
          email. We never ask for access to your repositories.
        </p>
        <ul className="role-list">
          {ROLES.map((role) => (
            <li key={role}>
              <b>{roleInfo[role].label}</b>
              <span>{roleInfo[role].blurb}</span>
            </li>
          ))}
        </ul>
        <form action={signInWithGitHub}>
          {preselect && <input type="hidden" name="role" value={preselect} />}
          <button className="btn btn-primary" type="submit">
            <Icon name="github" size={18} />
            Continue with GitHub
          </button>
        </form>
      </section>
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
      <h1>{registrations.length ? "Add another role" : "Complete your registration"}</h1>
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
