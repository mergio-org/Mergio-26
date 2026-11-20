import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/landing/icon";
import { StatusBadge } from "@/components/projects/status-badge";
import { requireUser } from "@/lib/dal";
import { roleInfo } from "@/lib/registration";
import { AccountNav } from "../account-nav";

export const metadata: Metadata = {
  title: "Dashboard — Mergio",
};

const statusStyle = {
  APPROVED: { label: "Approved", color: "text-(color:--green)" },
  PENDING: { label: "Under review", color: "text-(color:--gold)" },
  REJECTED: { label: "Not approved", color: "text-[#E5484D]" },
} as const;

export default async function DashboardPage() {
  const user = await requireUser();
  const [registrations, projects] = await Promise.all([
    prisma.registration.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.project.findMany({
      where: { ownerId: user.id, season: { isActive: true } },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, name: true, status: true },
    }),
  ]);
  const maintainer = registrations.some(
    (registration) => registration.role === "MAINTAINER" && registration.status !== "REJECTED",
  );
  const firstName = user.name.split(" ")[0] || user.githubLogin || "there";
  const registered = registrations.length > 0;

  return (
    <div className="w-full max-w-2xl">
      <AccountNav active="dashboard" isAdmin={user.isAdmin === true} />

      <section className="panel panel-featured px-8 py-14 text-center sm:px-14">
        <span className="mx-auto mb-7 grid size-16 place-items-center rounded-full border border-(color:--panel-border-strong) bg-(color:--ice-soft) text-(color:--ice) shadow-[0_0_32px_-6px_var(--ice-glow)]">
          <Icon name={registered ? "check" : "flake"} size={28} />
        </span>

        <h1 className="bg-linear-to-b from-white from-35% to-[#BFE1FF] bg-clip-text pb-1 text-4xl leading-tight font-semibold tracking-tight text-balance text-transparent sm:text-5xl light:from-[#0E1726] light:to-[#1F5FB8]">
          {registered ? `Thank you for registering, ${firstName}` : `Hey, ${firstName}`}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-lg text-(color:--muted)">
          {registered
            ? "The participating organizations will be announced soon. Stay tuned."
            : "You haven't registered yet. It takes a minute."}
        </p>

        {registered ? (
          <ul className="mt-9 mb-0 flex list-none flex-wrap justify-center gap-2 p-0">
            {registrations.map((registration) => {
              const status = statusStyle[registration.status];
              return (
                <li
                  key={registration.id}
                  className="inline-flex items-center gap-2.5 rounded-full border border-(color:--border-strong) py-1.5 pr-3.5 pl-4 text-sm"
                >
                  <span className="font-medium">{roleInfo[registration.role].label}</span>
                  <span
                    className={`inline-flex items-center gap-1.5 font-mono text-xs tracking-wide uppercase ${status.color}`}
                  >
                    <span className="size-1.5 rounded-full bg-current" />
                    {status.label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Link className="btn btn-primary mt-9" href="/register">
            Register now
          </Link>
        )}
      </section>

      {maintainer && (
        <section className="panel mt-4 p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="font-mono text-[13px] font-medium tracking-widest text-(color:--muted) uppercase">
              Your projects
            </h2>
            <Link className="btn btn-primary btn-sm" href="/projects/new">
              Submit a project
            </Link>
          </div>
          {projects.length > 0 ? (
            <ul className="mt-5 mb-0 list-none p-0">
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-(color:--border) py-3.5 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <Link
                    href={`/projects/${project.slug}/manage`}
                    className="font-medium hover:text-(color:--ice)"
                  >
                    {project.name}
                  </Link>
                  <StatusBadge status={project.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-(color:--muted)">
              Apply with your open-source project for this season. You can save a draft and submit
              it when it is ready.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
