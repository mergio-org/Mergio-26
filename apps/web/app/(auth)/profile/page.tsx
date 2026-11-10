import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/landing/icon";
import { requireUser } from "@/lib/dal";
import { roleInfo } from "@/lib/registration";
import { AccountNav } from "../account-nav";

export const metadata: Metadata = {
  title: "My profile — Mergio",
};

const statusLabel = {
  APPROVED: "Approved",
  PENDING: "Under review",
  REJECTED: "Not approved",
} as const;

// "https://github.com/owner/repo/" -> "owner/repo"
const repoLabel = (url: string) =>
  url.replace(/^https:\/\/github\.com\//, "").replace(/\/$/, "");

export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, registrations] = await Promise.all([
    prisma.profile.findUnique({ where: { userId: user.id } }),
    prisma.registration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const details = [
    { label: "Email", value: user.email },
    { label: "College", value: profile?.college },
    { label: "Graduation year", value: profile?.graduationYear },
    { label: "Phone", value: profile?.phone },
    { label: "Discord", value: profile?.discord },
  ];

  return (
    <div className="w-full max-w-2xl">
      <AccountNav active="profile" />

      <section className="panel p-8">
        <div className="flex items-center gap-5">
          <div className="size-[68px] flex-none rounded-full bg-[conic-gradient(from_200deg,var(--ice),var(--violet),var(--ice))] p-[3px] shadow-[0_0_28px_-6px_var(--ice-glow)]">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote GitHub avatar, no loader configured
              <img
                src={user.image}
                alt=""
                width={68}
                height={68}
                className="size-full rounded-full border-[3px] border-(color:--bg) object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-full place-items-center rounded-full border-[3px] border-(color:--bg) bg-(color:--surface-2) text-2xl font-semibold"
              >
                {user.name.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight break-words">
              {user.name}
            </h1>
            <p className="mt-1 inline-flex items-center gap-1.5 font-mono text-sm text-(color:--dim)">
              <Icon name="github" size={15} className="text-(color:--ice)" />@{user.githubLogin}
            </p>
          </div>
        </div>

        {profile ? (
          <dl className="mt-8 mb-0">
            {details.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-6 border-b border-(color:--border) py-3.5 last:border-b-0 last:pb-0"
              >
                <dt className="text-sm text-(color:--muted)">{label}</dt>
                <dd className="m-0 text-right font-medium break-words">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-8 text-(color:--muted)">
            Nothing here yet.{" "}
            <Link href="/register" className="font-semibold text-(color:--ice) hover:underline">
              Register
            </Link>{" "}
            and your details will show up here.
          </p>
        )}
      </section>

      {registrations.length > 0 && (
        <section className="panel mt-4 p-8">
          <h2 className="mb-5 font-mono text-[13px] font-medium tracking-widest text-(color:--muted) uppercase">
            Roles
          </h2>
          <ul className="m-0 list-none p-0">
            {registrations.map((registration) => (
              <li
                key={registration.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-(color:--border) py-3.5 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="font-medium">{roleInfo[registration.role].label}</p>
                  {registration.repoUrl && (
                    <a
                      href={registration.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 block truncate font-mono text-[13px] text-(color:--ice) hover:underline"
                    >
                      {repoLabel(registration.repoUrl)}
                    </a>
                  )}
                </div>
                <span className="font-mono text-xs tracking-wide text-(color:--muted) uppercase">
                  {statusLabel[registration.status]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
