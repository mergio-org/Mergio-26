import "server-only";
import { prisma, type ProjectStatus } from "@repo/db";
import { deliverAfterResponse, queueEmail } from "./email";
import {
  GitHubAuthError,
  GitHubRateLimitError,
  githubTokenFor,
  problemsOf,
  validateRepo,
  type RepoValidation,
} from "./github";
import {
  addReviewNote,
  changeProjectStatus,
  repoDecisionEmail,
  StatusChangeError,
} from "./project-status";
import {
  approvedEditSchema,
  EDITABLE_STATUSES,
  fieldErrors,
  MAX_REPOS,
  PROJECT_STATUSES,
  projectSchema,
  repoLinkSchema,
  type ProjectField,
  type RepoRef,
} from "./projects";
import {
  activeSeason,
  maintainerRegistration,
  uniqueSlug,
} from "./projects-server";

// The project rules, shared by the server actions (forms) and the /api/v1 route handlers.
// Every function checks who is acting and returns a result instead of throwing, with an HTTP
// status the API can pass through.

export type Actor = { id: string; isAdmin?: boolean | null };

export type Failure = {
  ok: false;
  status: 400 | 401 | 403 | 404 | 409 | 429 | 502;
  message: string;
  errors?: Partial<Record<ProjectField, string>>;
  /** Per-repo problems found on GitHub, keyed "owner/name". */
  repoProblems?: Record<string, string[]>;
};
export type Result<T extends object = object> = ({ ok: true } & T) | Failure;

const fail = (
  status: Failure["status"],
  message: string,
  extra?: Partial<Failure>,
): Failure => ({
  ok: false,
  status,
  message,
  ...extra,
});

type Found = Extract<RepoValidation, { found: true }>;
type Checked = { ref: RepoRef; validation: RepoValidation };

/** Runs the GitHub checks on every repo with the actor's own token. */
async function checkRepos(
  userId: string,
  repos: RepoRef[],
): Promise<
  Result<{ checked: Checked[]; repoProblems: Record<string, string[]> }>
> {
  const token = await githubTokenFor(userId);
  if (!token)
    return fail(
      401,
      "Your GitHub sign-in has expired. Sign out and sign in with GitHub again.",
    );
  try {
    const checked = await Promise.all(
      repos.map(async (ref) => ({
        ref,
        validation: await validateRepo(ref, token),
      })),
    );
    const repoProblems: Record<string, string[]> = {};
    for (const { ref, validation } of checked) {
      const problems = problemsOf(validation);
      if (problems.length) repoProblems[`${ref.owner}/${ref.name}`] = problems;
    }
    return { ok: true, checked, repoProblems };
  } catch (error) {
    if (error instanceof GitHubAuthError) {
      return fail(
        401,
        "Your GitHub sign-in has expired. Sign out and sign in with GitHub again.",
      );
    }
    if (error instanceof GitHubRateLimitError) {
      return fail(
        429,
        "GitHub is rate-limiting us right now. Try again in a few minutes.",
      );
    }
    return fail(502, "Could not reach GitHub. Try again in a minute.");
  }
}

const storedValidation = (repo: Found) => ({
  license: repo.license,
  checks: repo.checks,
});

/** The project, if the actor owns it. */
async function ownedProject(actor: Actor, projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.ownerId !== actor.id) return null;
  return project;
}

// ---------------------------------------------------------------------------
// Applying
// ---------------------------------------------------------------------------

/**
 * Creates a draft (projectId null) or saves the whole application while it is a draft or has
 * changes requested. A repo that doesn't exist on GitHub blocks saving; failed checks come back
 * as `repoProblems` to fix before submitting.
 */
export async function saveApplication(
  actor: Actor,
  projectId: string | null,
  raw: unknown,
): Promise<
  Result<{
    project: { id: string; slug: string };
    created: boolean;
    repoProblems: Record<string, string[]>;
  }>
> {
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success)
    return fail(400, "Some fields need attention.", {
      errors: fieldErrors(parsed.error),
    });
  const data = parsed.data;

  const existing = projectId ? await ownedProject(actor, projectId) : null;
  if (projectId) {
    if (!existing) return fail(404, "Project not found.");
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      return fail(
        409,
        "This application is with the reviewers and can't be edited right now.",
      );
    }
  } else if (!(await maintainerRegistration(actor.id))) {
    return fail(403, "Register as a maintainer before submitting a project.");
  }

  const season = await activeSeason();
  if (!season) return fail(409, "There is no open season to apply to yet.");

  const checks = await checkRepos(actor.id, data.repos);
  if (!checks.ok) return checks;
  if (checks.checked.some(({ validation }) => !validation.found)) {
    return fail(400, "Some repos could not be found on GitHub.", {
      errors: {
        repos:
          "Some repos could not be found on GitHub. Fix them and save again.",
      },
      repoProblems: checks.repoProblems,
    });
  }

  // The same repo typed two ways (e.g. after a rename) resolves to one GitHub id.
  const repos = new Map<bigint, Found>();
  for (const { validation } of checks.checked) {
    if (validation.found) repos.set(validation.githubRepoId, validation);
  }
  const fields = {
    name: data.name,
    description: data.description,
    techStack: data.techStack,
    difficultyEasy: data.difficultyEasy,
    difficultyMedium: data.difficultyMedium,
    difficultyHard: data.difficultyHard,
    logoUrl: data.logoUrl ?? null,
    discordChannel: data.discordChannel ?? null,
    contributingUrl: data.contributingUrl ?? null,
    expectedMentors: data.expectedMentors,
    license: data.license,
  };
  const now = new Date();
  const repoRows = [...repos.values()].map((repo) => ({
    githubRepoId: repo.githubRepoId,
    owner: repo.owner,
    name: repo.name,
    validation: storedValidation(repo),
    validatedAt: now,
  }));

  if (!existing) {
    const slug = await uniqueSlug(season.id, data.name);
    const project = await prisma.project.create({
      data: {
        ...fields,
        slug,
        seasonId: season.id,
        ownerId: actor.id,
        repos: { create: repoRows },
      },
      select: { id: true, slug: true },
    });
    return {
      ok: true,
      project,
      created: true,
      repoProblems: checks.repoProblems,
    };
  }

  // Nothing has been scored before approval, so the repo list is simply replaced.
  await prisma.$transaction([
    prisma.project.update({ where: { id: existing.id }, data: fields }),
    prisma.projectRepo.deleteMany({
      where: {
        projectId: existing.id,
        githubRepoId: { notIn: [...repos.keys()] },
      },
    }),
    ...repoRows.map((row) =>
      prisma.projectRepo.upsert({
        where: {
          projectId_githubRepoId: {
            projectId: existing.id,
            githubRepoId: row.githubRepoId,
          },
        },
        create: { ...row, projectId: existing.id },
        update: { ...row, removedAt: null },
      }),
    ),
  ]);
  return {
    ok: true,
    project: { id: existing.id, slug: existing.slug },
    created: false,
    repoProblems: checks.repoProblems,
  };
}

/** Re-checks every repo and sends the application to the reviewers. */
export async function submitApplication(
  actor: Actor,
  projectId: string,
): Promise<Result<{ project: { id: string; slug: string } }>> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { repos: { where: { removedAt: null } } },
  });
  if (!project || project.ownerId !== actor.id)
    return fail(404, "Project not found.");
  if (!EDITABLE_STATUSES.includes(project.status))
    return fail(409, "This application has already been submitted.");
  if (project.repos.length === 0)
    return fail(400, "Add at least one repo before submitting.");

  const checks = await checkRepos(
    actor.id,
    project.repos.map((repo) => ({ owner: repo.owner, name: repo.name })),
  );
  if (!checks.ok) return checks;

  // Keep the stored results (and names, in case a repo was renamed) current either way.
  const now = new Date();
  await prisma.$transaction(
    checks.checked.flatMap(({ ref, validation }) => {
      const row = project.repos.find(
        (repo) => repo.owner === ref.owner && repo.name === ref.name,
      );
      if (!row || !validation.found) return [];
      return [
        prisma.projectRepo.update({
          where: { id: row.id },
          data: {
            owner: validation.owner,
            name: validation.name,
            validation: storedValidation(validation),
            validatedAt: now,
          },
        }),
      ];
    }),
  );

  if (Object.keys(checks.repoProblems).length) {
    return fail(
      400,
      "Some repos don't meet the requirements yet. Fix the items below and submit again.",
      {
        repoProblems: checks.repoProblems,
      },
    );
  }

  try {
    // Records the submission and emails the project admin a confirmation.
    await changeProjectStatus({
      projectId: project.id,
      from: project.status,
      to: "SUBMITTED",
      actorId: actor.id,
    });
  } catch (error) {
    if (error instanceof StatusChangeError) return fail(409, error.message);
    throw error;
  }
  return { ok: true, project: { id: project.id, slug: project.slug } };
}

// ---------------------------------------------------------------------------
// After approval
// ---------------------------------------------------------------------------

/** Once approved, the project admin can still change the description and tech stack. */
export async function updateApprovedDetails(
  actor: Actor,
  projectId: string,
  raw: unknown,
): Promise<Result<{ project: { id: string; slug: string } }>> {
  const project = await ownedProject(actor, projectId);
  if (!project) return fail(404, "Project not found.");
  if (project.status !== "APPROVED")
    return fail(409, "Only approved projects use this form.");
  const parsed = approvedEditSchema.safeParse(raw);
  if (!parsed.success)
    return fail(400, "Some fields need attention.", {
      errors: fieldErrors(parsed.error),
    });
  await prisma.project.update({ where: { id: project.id }, data: parsed.data });
  return { ok: true, project: { id: project.id, slug: project.slug } };
}

/**
 * Adds a repo. On an approved project the repo must pass every check and then waits for an
 * organizer (anti-abuse); on a draft it is simply part of the application. A previously removed
 * repo is restored the same way.
 */
export async function addRepo(
  actor: Actor,
  projectId: string,
  url: unknown,
): Promise<
  Result<{
    repo: { id: string; owner: string; name: string; approval: string };
  }>
> {
  const project = await ownedProject(actor, projectId);
  if (!project) return fail(404, "Project not found.");
  const approved = project.status === "APPROVED";
  if (!approved && !EDITABLE_STATUSES.includes(project.status)) {
    return fail(
      409,
      "Repos can't be changed while the application is with the reviewers.",
    );
  }
  const parsed = repoLinkSchema.safeParse(url);
  if (!parsed.success)
    return fail(400, "Check the repo link.", {
      errors: {
        repos: parsed.error.issues[0]?.message ?? "Check the repo link.",
      },
    });

  const active = await prisma.projectRepo.count({
    where: { projectId, removedAt: null },
  });
  if (active >= MAX_REPOS)
    return fail(409, `A project can have at most ${MAX_REPOS} repos.`);

  const checks = await checkRepos(actor.id, [parsed.data]);
  if (!checks.ok) return checks;
  const validation = checks.checked[0]!.validation;
  if (!validation.found)
    return fail(400, validation.reason, { repoProblems: checks.repoProblems });
  if (approved && Object.keys(checks.repoProblems).length) {
    return fail(400, "The repo doesn't meet the requirements yet.", {
      repoProblems: checks.repoProblems,
    });
  }

  const existing = await prisma.projectRepo.findUnique({
    where: {
      projectId_githubRepoId: {
        projectId,
        githubRepoId: validation.githubRepoId,
      },
    },
  });
  if (existing && !existing.removedAt)
    return fail(409, "That repo is already part of the project.");

  const data = {
    owner: validation.owner,
    name: validation.name,
    validation: storedValidation(validation),
    validatedAt: new Date(),
    approval: "PENDING" as const,
    removedAt: null,
  };
  const repo = existing
    ? await prisma.projectRepo.update({ where: { id: existing.id }, data })
    : await prisma.projectRepo.create({
        data: { ...data, projectId, githubRepoId: validation.githubRepoId },
      });
  return {
    ok: true,
    repo: {
      id: repo.id,
      owner: repo.owner,
      name: repo.name,
      approval: repo.approval,
    },
  };
}

/**
 * Removes a repo. On an approved project the row is kept (removedAt), so points already earned
 * stay and only future scoring stops; the last accepted repo can't be removed, so a live project
 * never drops to zero tracked repos. On a draft it is simply deleted.
 */
export async function removeRepo(
  actor: Actor,
  projectId: string,
  repoId: string,
): Promise<Result> {
  const project = await ownedProject(actor, projectId);
  if (!project) return fail(404, "Project not found.");
  const repo = await prisma.projectRepo.findFirst({
    where: { id: repoId, projectId, removedAt: null },
  });
  if (!repo) return fail(404, "Repo not found.");

  if (EDITABLE_STATUSES.includes(project.status)) {
    await prisma.projectRepo.delete({ where: { id: repo.id } });
    return { ok: true };
  }
  if (project.status !== "APPROVED") {
    return fail(
      409,
      "Repos can't be changed while the application is with the reviewers.",
    );
  }
  if (repo.approval === "APPROVED") {
    const others = await prisma.projectRepo.count({
      where: {
        projectId,
        removedAt: null,
        approval: "APPROVED",
        id: { not: repo.id },
      },
    });
    if (others === 0) {
      return fail(
        409,
        "This is the project's only accepted repo. Add another one before removing it.",
      );
    }
  }
  await prisma.projectRepo.update({
    where: { id: repo.id },
    data: { removedAt: new Date() },
  });
  return { ok: true };
}

/** GitHub App tracking per repo. Visible to the owner and organizers, and to anyone once live. */
export async function installStatus(
  actor: Actor | null,
  projectId: string,
): Promise<
  Result<{
    tracking: "active" | "partial" | "not_installed";
    repos: {
      id: string;
      fullName: string;
      approval: string;
      trackingStatus: string;
    }[];
  }>
> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      repos: { where: { removedAt: null }, orderBy: { createdAt: "asc" } },
    },
  });
  const isLive =
    project?.status === "APPROVED" &&
    project.repos.some((repo) => repo.approval === "APPROVED");
  const privileged =
    !!actor && (actor.id === project?.ownerId || actor.isAdmin === true);
  if (!project || (!isLive && !privileged))
    return fail(404, "Project not found.");

  const repos = project.repos.filter(
    (repo) => privileged || repo.approval === "APPROVED",
  );
  const accepted = repos.filter((repo) => repo.approval === "APPROVED");
  const active = accepted.filter(
    (repo) => repo.trackingStatus === "ACTIVE",
  ).length;
  return {
    ok: true,
    tracking:
      active === 0
        ? "not_installed"
        : active === accepted.length
          ? "active"
          : "partial",
    repos: repos.map((repo) => ({
      id: repo.id,
      fullName: `${repo.owner}/${repo.name}`,
      approval: repo.approval,
      trackingStatus: repo.trackingStatus,
    })),
  };
}

// ---------------------------------------------------------------------------
// Returning projects
// ---------------------------------------------------------------------------

/** Starts this season's application from one of the actor's projects in an earlier season. */
export async function copyFromLastSeason(
  actor: Actor,
  sourceId: string,
): Promise<Result<{ project: { id: string; slug: string } }>> {
  const [season, source] = await Promise.all([
    activeSeason(),
    prisma.project.findUnique({
      where: { id: sourceId },
      include: {
        repos: { where: { removedAt: null, approval: { not: "REJECTED" } } },
      },
    }),
  ]);
  if (!season) return fail(409, "There is no open season to apply to yet.");
  if (!source || source.ownerId !== actor.id)
    return fail(404, "Project not found.");
  if (source.seasonId === season.id)
    return fail(409, "That project is already in this season.");
  if (!(await maintainerRegistration(actor.id))) {
    return fail(403, "Register as a maintainer before submitting a project.");
  }
  const copied = await prisma.project.findFirst({
    where: { seasonId: season.id, copiedFromId: source.id },
    select: { slug: true },
  });
  if (copied)
    return fail(
      409,
      `You already copied it this season (/projects/${copied.slug}).`,
    );

  // Keep the old slug when it is free, so the project keeps its address.
  const slug = await uniqueSlug(season.id, source.slug);
  const project = await prisma.project.create({
    data: {
      seasonId: season.id,
      ownerId: actor.id,
      slug,
      copiedFromId: source.id,
      name: source.name,
      description: source.description,
      techStack: source.techStack,
      difficultyEasy: source.difficultyEasy,
      difficultyMedium: source.difficultyMedium,
      difficultyHard: source.difficultyHard,
      logoUrl: source.logoUrl,
      discordChannel: source.discordChannel,
      contributingUrl: source.contributingUrl,
      expectedMentors: source.expectedMentors,
      license: source.license,
      // Checks run again when the copy is saved or submitted.
      repos: {
        create: source.repos.map((repo) => ({
          githubRepoId: repo.githubRepoId,
          owner: repo.owner,
          name: repo.name,
        })),
      },
    },
    select: { id: true, slug: true },
  });
  return { ok: true, project };
}

// ---------------------------------------------------------------------------
// Organizers
// ---------------------------------------------------------------------------

/** Accepts or rejects a repo added to an approved project, and tells the project admin. */
export async function decideRepo(
  actor: Actor,
  repoId: string,
  accept: boolean,
  note?: string,
): Promise<Result> {
  if (!actor.isAdmin) return fail(403, "Only organizers can approve repos.");
  const repo = await prisma.projectRepo.findUnique({
    where: { id: repoId },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          owner: { select: { id: true, email: true, name: true } },
        },
      },
    },
  });
  if (!repo || repo.removedAt) return fail(404, "Repo not found.");
  if (repo.project.status !== "APPROVED") {
    return fail(
      409,
      "Repos in an application are decided together with the project.",
    );
  }
  const reason = note?.trim() || null;
  if (!accept && !reason)
    return fail(400, "Tell the project admin why the repo was rejected.");

  const fullName = `${repo.owner}/${repo.name}`;
  const emailId = await prisma.$transaction(async (tx) => {
    const { count } = await tx.projectRepo.updateMany({
      where: { id: repo.id, approval: "PENDING", removedAt: null },
      data: { approval: accept ? "APPROVED" : "REJECTED" },
    });
    if (count === 0) return null;
    await tx.projectReview.create({
      data: {
        projectId: repo.project.id,
        actorId: actor.id,
        internalNote: `${accept ? "Accepted" : "Rejected"} repo ${fullName}`,
        publicReason: reason,
      },
    });
    return queueEmail(tx, {
      toEmail: repo.project.owner.email,
      toUserId: repo.project.owner.id,
      category: "project-repo",
      ...repoDecisionEmail({
        project: repo.project,
        repo: fullName,
        accept,
        reason,
      }),
    });
  });
  if (!emailId)
    return fail(
      409,
      "Someone decided on this repo meanwhile. Reload to see it.",
    );
  deliverAfterResponse([emailId]);
  return { ok: true };
}

/** For the API: the organizer's review decision, with the same rules as the review form. */
export async function reviewDecision(
  actor: Actor,
  projectId: string,
  body: {
    decision?: unknown;
    seenStatus?: unknown;
    internalNote?: unknown;
    publicReason?: unknown;
  },
): Promise<Result> {
  if (!actor.isAdmin) return fail(403, "Only organizers can review projects.");
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  const isStatus = (value: string): value is ProjectStatus =>
    (PROJECT_STATUSES as readonly string[]).includes(value);
  const decision = text(body.decision);
  const seen = text(body.seenStatus);
  if (decision !== "NOTE" && !isStatus(decision)) {
    return fail(
      400,
      `decision must be one of ${[...PROJECT_STATUSES, "NOTE"].join(", ")}.`,
    );
  }
  if (seen && !isStatus(seen))
    return fail(400, "seenStatus is not a project status.");
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { status: true },
  });
  if (!project) return fail(404, "Project not found.");
  try {
    if (decision === "NOTE") {
      await addReviewNote(projectId, actor.id, text(body.internalNote));
    } else {
      await changeProjectStatus({
        projectId,
        // Without seenStatus the current status is assumed (the caller just read it).
        from: seen ? (seen as ProjectStatus) : project.status,
        to: decision,
        actorId: actor.id,
        internalNote: text(body.internalNote),
        publicReason: text(body.publicReason),
      });
    }
  } catch (error) {
    if (error instanceof StatusChangeError) return fail(409, error.message);
    throw error;
  }
  return { ok: true };
}
