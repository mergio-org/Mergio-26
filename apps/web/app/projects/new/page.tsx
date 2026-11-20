import { prisma } from "@repo/db";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { activeSeason, maintainerRegistration } from "@/lib/projects-server";
import { copyProjectAction, saveProjectAction } from "../actions";
import { CopyProjectButton } from "../approved-tools";
import { EMPTY_PROJECT } from "@/lib/projects";
import { ProjectForm } from "../project-form";

export const metadata: Metadata = {
  title: "Submit a project — Mergio",
  robots: { index: false, follow: false },
};

export default async function NewProjectPage() {
  const user = await requireUser();
  const [registration, season] = await Promise.all([
    maintainerRegistration(user.id),
    activeSeason(),
  ]);

  if (!registration || !season) {
    return (
      <section className="auth-card panel mx-auto">
        <h1>
          {season
            ? "Register as a maintainer first"
            : "Applications are not open yet"}
        </h1>
        <p className="auth-lead">
          {season
            ? "Projects are submitted by maintainers. Add the maintainer role to your registration, then come back here."
            : "There is no open season to apply to. We will announce when project applications open."}
        </p>
        {season && (
          <Link className="btn btn-primary" href="/register?role=maintainer">
            Register as a maintainer
          </Link>
        )}
      </section>
    );
  }

  // Projects from earlier seasons that haven't been copied into this one yet.
  const earlier = await prisma.project.findMany({
    where: {
      ownerId: user.id,
      seasonId: { not: season.id },
      copies: { none: { seasonId: season.id } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, season: { select: { name: true } } },
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {earlier.length > 0 && (
        <section className="panel p-6">
          <h2 className="text-lg font-semibold">Returning project?</h2>
          <p className="mt-1 text-sm text-(color:--muted)">
            Projects re-apply each season. Start from last season&apos;s
            application and update it.
          </p>
          <ul className="mt-4 mb-0 list-none p-0">
            {earlier.map((project) => (
              <li
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-(color:--border) py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span>
                  <b className="font-medium">{project.name}</b>{" "}
                  <span className="text-sm text-(color:--dim)">
                    {project.season.name}
                  </span>
                </span>
                <CopyProjectButton
                  action={copyProjectAction.bind(null, project.id)}
                  season={season.name}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="auth-card panel max-w-none!">
        <span className="join-step">{season.name} · Project application</span>
        <h1>Submit a project</h1>
        <p className="auth-lead">
          Save a draft first. We check each repo on GitHub as you save, and you
          submit for review once every check passes.
        </p>
        <ProjectForm
          action={saveProjectAction.bind(null, null)}
          defaults={{ ...EMPTY_PROJECT, repos: registration.repoUrl ?? "" }}
          submitLabel="Save draft"
        />
      </section>
    </div>
  );
}
