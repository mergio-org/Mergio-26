import "server-only";
import { prisma, type ProjectStatus } from "@repo/db";
import { deliverAfterResponse, escapeHtml, queueEmail } from "./email";
import { statusInfo } from "./projects";

// Every project status change goes through changeProjectStatus(): it checks the transition,
// updates the status only if nobody changed it meanwhile, records the change in the review
// history and emails the project admin, all in one transaction. It does not check who is
// asking; callers do (the owner submits, organizers decide).

/** Allowed moves. The project admin submits and resubmits; organizers do the rest. */
export const TRANSITIONS: Record<ProjectStatus, readonly ProjectStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["UNDER_REVIEW", "CHANGES_REQUESTED", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["CHANGES_REQUESTED", "APPROVED", "REJECTED"],
  CHANGES_REQUESTED: ["SUBMITTED"],
  APPROVED: [],
  REJECTED: [],
};

/** Decisions that must tell the project admin why. */
export const NEEDS_PUBLIC_REASON: readonly ProjectStatus[] = [
  "CHANGES_REQUESTED",
  "REJECTED",
];

export class StatusChangeError extends Error {}

export async function changeProjectStatus({
  projectId,
  from,
  to,
  actorId,
  internalNote,
  publicReason,
}: {
  projectId: string;
  /** The status the caller saw; the change fails if the project has moved on since. */
  from: ProjectStatus;
  to: ProjectStatus;
  actorId: string;
  internalNote?: string | null;
  publicReason?: string | null;
}) {
  if (!TRANSITIONS[from].includes(to)) {
    throw new StatusChangeError(
      `A project can't go from ${statusInfo[from].label} to ${statusInfo[to].label}.`,
    );
  }
  const reason = publicReason?.trim() || null;
  if (NEEDS_PUBLIC_REASON.includes(to) && !reason) {
    throw new StatusChangeError(
      "Give the project admin a reason they will see.",
    );
  }

  const emailId = await prisma.$transaction(async (tx) => {
    if (to === "APPROVED") {
      // A project never goes live without a repo to track.
      const repos = await tx.projectRepo.count({
        where: { projectId, removedAt: null, approval: { not: "REJECTED" } },
      });
      if (repos === 0)
        throw new StatusChangeError(
          "A project needs at least one repo to be approved.",
        );
    }

    const now = new Date();
    const { count } = await tx.project.updateMany({
      where: { id: projectId, status: from },
      data: {
        status: to,
        // The reason shown to the PA belongs to the latest decision; anything else clears it.
        publicReason:
          NEEDS_PUBLIC_REASON.includes(to) || to === "APPROVED" ? reason : null,
        ...(to === "SUBMITTED" ? { submittedAt: now } : {}),
        ...(to === "APPROVED" ? { approvedAt: now } : {}),
      },
    });
    if (count === 0) {
      throw new StatusChangeError(
        "Someone changed this project meanwhile. Reload and try again.",
      );
    }

    if (to === "APPROVED") {
      // Repos in the application are accepted together with the project.
      await tx.projectRepo.updateMany({
        where: { projectId, removedAt: null, approval: "PENDING" },
        data: { approval: "APPROVED" },
      });
    }

    await tx.projectReview.create({
      data: {
        projectId,
        actorId,
        fromStatus: from,
        toStatus: to,
        internalNote: internalNote?.trim() || null,
        publicReason: reason,
      },
    });

    const project = await tx.project.findUniqueOrThrow({
      where: { id: projectId },
      select: {
        name: true,
        slug: true,
        owner: { select: { id: true, email: true, name: true } },
      },
    });
    return queueEmail(tx, {
      toEmail: project.owner.email,
      toUserId: project.owner.id,
      category: "project-status",
      ...statusEmail({ ...project, status: to, reason }),
    });
  });

  deliverAfterResponse([emailId]);
}

/** A reviewer note with no status change. Organizers only see it. */
export async function addReviewNote(
  projectId: string,
  actorId: string,
  note: string,
) {
  const text = note.trim();
  if (!text) throw new StatusChangeError("Write a note first.");
  await prisma.projectReview.create({
    data: { projectId, actorId, internalNote: text },
  });
}

// ---------------------------------------------------------------------------
// The status emails
// ---------------------------------------------------------------------------

const siteUrl = () =>
  (process.env.BETTER_AUTH_URL || "https://mergio.in").replace(/\/$/, "");

/** The GitHub App install page, once the app exists (F-06). */
export const githubAppInstallUrl = () => {
  const slug = process.env.GITHUB_APP_SLUG;
  return slug
    ? `https://github.com/apps/${encodeURIComponent(slug)}/installations/new`
    : null;
};

function statusEmail({
  name,
  slug,
  owner,
  status,
  reason,
}: {
  name: string;
  slug: string;
  owner: { name: string };
  status: ProjectStatus;
  reason: string | null;
}) {
  const manage = `${siteUrl()}/projects/${slug}/manage`;
  const install = githubAppInstallUrl();
  const firstName = owner.name.split(" ")[0] || "there";

  const copy: Record<ProjectStatus, { subject: string; lines: string[] }> = {
    DRAFT: { subject: `${name} is back to draft`, lines: [] },
    SUBMITTED: {
      subject: `We received ${name}`,
      lines: [
        `Thanks for submitting ${name} to Mergio. The team will review it and email you when its status changes.`,
      ],
    },
    UNDER_REVIEW: {
      subject: `${name} is under review`,
      lines: [`The Mergio team has started reviewing ${name}.`],
    },
    CHANGES_REQUESTED: {
      subject: `Changes requested for ${name}`,
      lines: [
        `The Mergio team reviewed ${name} and asked for a few changes before it can be approved.`,
        "Update your application and resubmit it when it is ready.",
      ],
    },
    APPROVED: {
      subject: `${name} is approved for Mergio`,
      lines: [
        `Good news: ${name} is approved and now listed on Mergio.`,
        install
          ? `Next, install the Mergio GitHub App on your repos so contributions are tracked: ${install}`
          : "Next, you'll be asked to install the Mergio GitHub App on your repos so contributions are tracked. We'll email you when it is ready.",
      ],
    },
    REJECTED: {
      subject: `Update on ${name}`,
      lines: [
        `Thank you for applying with ${name}. The Mergio team could not approve it for this season.`,
      ],
    },
  };

  const { subject, lines } = copy[status];
  return composeEmail({
    subject,
    firstName,
    lines,
    reasonLabel: status === "APPROVED" ? "A note from the team" : "Reason",
    reason,
    statusLabel: statusInfo[status].label,
    manage,
  });
}

/** Tells the project admin whether a repo they added after approval was accepted. */
export function repoDecisionEmail({
  project,
  repo,
  accept,
  reason,
}: {
  project: { name: string; slug: string; owner: { name: string } };
  repo: string;
  accept: boolean;
  reason: string | null;
}) {
  return composeEmail({
    subject: accept
      ? `${repo} is now part of ${project.name}`
      : `${repo} was not added to ${project.name}`,
    firstName: project.owner.name.split(" ")[0] || "there",
    lines: accept
      ? [
          `The Mergio team accepted ${repo} for ${project.name}.`,
          "Contributions to it count once the Mergio GitHub App is installed on it.",
        ]
      : [`The Mergio team could not add ${repo} to ${project.name}.`],
    reasonLabel: "Reason",
    reason,
    statusLabel: null,
    manage: `${siteUrl()}/projects/${project.slug}/manage`,
  });
}

/** The plain-text and HTML versions of one email, in the same simple layout. */
function composeEmail({
  subject,
  firstName,
  lines,
  reasonLabel,
  reason,
  statusLabel,
  manage,
}: {
  subject: string;
  firstName: string;
  lines: string[];
  reasonLabel: string;
  reason: string | null;
  statusLabel: string | null;
  manage: string;
}) {
  const text = [
    `Hi ${firstName},`,
    "",
    ...lines.flatMap((line) => [line, ""]),
    ...(reason ? [`${reasonLabel}:`, reason, ""] : []),
    ...(statusLabel ? [`Status: ${statusLabel}`] : []),
    `Manage your project: ${manage}`,
    "",
    "The Mergio team",
  ].join("\n");

  const paragraph = (value: string) =>
    `<p style="margin:0 0 14px">${escapeHtml(value).replace(/https?:\/\/\S+/g, (url) => `<a href="${url}">${url}</a>`)}</p>`;
  const html = [
    `<div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#0e1726;max-width:560px">`,
    paragraph(`Hi ${firstName},`),
    ...lines.map(paragraph),
    reason
      ? `<p style="margin:0 0 6px;font-weight:600">${escapeHtml(reasonLabel)}</p><blockquote style="margin:0 0 14px;padding:10px 14px;border-left:3px solid #8ccbff;background:#f4f8fc;white-space:pre-line">${escapeHtml(reason)}</blockquote>`
      : "",
    statusLabel
      ? `<p style="margin:0 0 14px">Status: <b>${escapeHtml(statusLabel)}</b></p>`
      : "",
    `<p style="margin:0 0 20px"><a href="${manage}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#0e1726;color:#fff;text-decoration:none;font-weight:600">Manage your project</a></p>`,
    `<p style="margin:0;color:#5d6a7c">The Mergio team</p>`,
    `</div>`,
  ].join("");

  return { subject, text, html };
}
