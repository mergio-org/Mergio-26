import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { ROLES, roleInfo } from "@/lib/registration";
import { signOutAction } from "../actions";

export const metadata: Metadata = {
  title: "Dashboard — Mergio",
};

const statusLabel = {
  APPROVED: "Approved",
  PENDING: "Under review",
  REJECTED: "Not approved",
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const registrations = await prisma.registration.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const held = new Set(registrations.map((registration) => registration.role));

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

      <h1>{registrations.length ? "You're registered" : "You haven't registered yet"}</h1>
      <p className="auth-lead">
        {registrations.length
          ? "We will email you as soon as Mergio opens. Role reviews happen before then."
          : "Pick how you want to take part to get on the list."}
      </p>

      {registrations.length > 0 && (
        <ul className="status-list">
          {registrations.map((registration) => (
            <li key={registration.id}>
              <span>{roleInfo[registration.role].label}</span>
              <span className={`status status-${registration.status.toLowerCase()}`}>
                {statusLabel[registration.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {held.size < ROLES.length && (
        <Link className="btn btn-ghost" href="/register">
          {registrations.length ? "Add another role" : "Register now"}
        </Link>
      )}
    </section>
  );
}
