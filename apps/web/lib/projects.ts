import { z } from "zod";

// Shared by the project form (client) and the server actions. Plain data only, no server imports.

export const PROJECT_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "REJECTED",
] as const;
export type ProjectStatusName = (typeof PROJECT_STATUSES)[number];

export const statusInfo: Record<
  ProjectStatusName,
  { label: string; tone: "muted" | "gold" | "ice" | "green" | "red" }
> = {
  DRAFT: { label: "Draft", tone: "muted" },
  SUBMITTED: { label: "Submitted", tone: "ice" },
  UNDER_REVIEW: { label: "Under review", tone: "gold" },
  CHANGES_REQUESTED: { label: "Changes requested", tone: "gold" },
  APPROVED: { label: "Approved", tone: "green" },
  REJECTED: { label: "Not approved", tone: "red" },
};

/** The project admin can edit the application only while it is with them, not with the reviewers. */
export const EDITABLE_STATUSES: readonly ProjectStatusName[] = [
  "DRAFT",
  "CHANGES_REQUESTED",
];

export const MAX_REPOS = 10;

// OSI-approved licenses, by SPDX identifier, that GitHub detects. A repo must carry one of these.
// Source: https://opensource.org/licenses (checked against GitHub's license picker).
export const OSI_LICENSES = [
  "0BSD",
  "AFL-3.0",
  "AGPL-3.0",
  "Apache-2.0",
  "Artistic-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "BSD-3-Clause-Clear",
  "BSL-1.0",
  "ECL-2.0",
  "EPL-1.0",
  "EPL-2.0",
  "EUPL-1.1",
  "EUPL-1.2",
  "GPL-2.0",
  "GPL-3.0",
  "ISC",
  "LGPL-2.1",
  "LGPL-3.0",
  "LPPL-1.3c",
  "MIT",
  "MIT-0",
  "MPL-2.0",
  "MS-PL",
  "MS-RL",
  "MulanPSL-2.0",
  "NCSA",
  "OFL-1.1",
  "OSL-3.0",
  "PostgreSQL",
  "UPL-1.0",
  "Unlicense",
  "Zlib",
] as const;
export type OsiLicense = (typeof OSI_LICENSES)[number];

export const isOsiLicense = (
  spdx: string | null | undefined,
): spdx is OsiLicense =>
  !!spdx && (OSI_LICENSES as readonly string[]).includes(spdx);

/** "Snow Drift!" -> "snow-drift". Never empty: falls back to "project". */
export function slugify(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return slug || "project";
}

export type RepoRef = { owner: string; name: string };

const REPO_URL =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9._-]{1,100}?)(?:\.git)?\/?$/;

/** "https://github.com/owner/repo" (or "github.com/owner/repo.git") -> { owner, name }, else null. */
export function parseRepoUrl(value: string): RepoRef | null {
  const match = REPO_URL.exec(value.trim());
  if (!match) return null;
  const [, owner, name] = match;
  if (!owner || !name || name === "." || name === "..") return null;
  return { owner, name };
}

export const repoKey = (repo: RepoRef) =>
  `${repo.owner}/${repo.name}`.toLowerCase();
export const repoUrl = (repo: RepoRef) =>
  `https://github.com/${repo.owner}/${repo.name}`;

/** The first repo owner's GitHub avatar, used when the project has no logo of its own. */
export const ownerAvatar = (owner: string) =>
  `https://github.com/${encodeURIComponent(owner)}.png?size=160`;

// Blank inputs arrive as "" from FormData. Treat them as "not provided".
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalHttpsUrl = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .max(300, "Keep this under 300 characters")
    .url("Enter a full link starting with https://")
    .refine((url) => url.startsWith("https://"), "Use an https:// link")
    .optional(),
);

const percent = (label: string) =>
  z.coerce
    .number(`Enter a number for ${label}`)
    .int(`Use a whole number for ${label}`)
    .min(0, `${label} can't be negative`)
    .max(100, `${label} can be at most 100`);

const projectFields = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Give the project a name")
    .max(80, "Keep the name under 80 characters"),
  description: z
    .string()
    .trim()
    .min(40, "Describe the project in at least a few sentences")
    .max(6000, "Keep the description under 6000 characters"),
  // Comma-separated in the form: "TypeScript, React, Postgres".
  techStack: z
    .string()
    .transform((value) => {
      const seen = new Set<string>();
      return value
        .split(",")
        .map((tag) => tag.trim().replace(/\s+/g, " "))
        .filter((tag) => {
          const key = tag.toLowerCase();
          if (!tag || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    })
    .pipe(
      z
        .array(z.string().max(24, "Keep each tag under 24 characters"))
        .min(1, "Add at least one technology")
        .max(10, "Add at most 10 technologies"),
    ),
  difficultyEasy: percent("Beginner"),
  difficultyMedium: percent("Intermediate"),
  difficultyHard: percent("Advanced"),
  // One GitHub repo link per line in the form.
  repos: z
    .string()
    .transform((value, ctx) => {
      const repos: RepoRef[] = [];
      const seen = new Set<string>();
      for (const line of value.split(/\r?\n/)) {
        if (!line.trim()) continue;
        const repo = parseRepoUrl(line);
        if (!repo) {
          ctx.addIssue({
            code: "custom",
            message: `"${line.trim().slice(0, 60)}" is not a GitHub repo link like https://github.com/owner/repo`,
          });
          return z.NEVER;
        }
        if (seen.has(repoKey(repo))) continue;
        seen.add(repoKey(repo));
        repos.push(repo);
      }
      return repos;
    })
    .pipe(
      z
        .array(z.object({ owner: z.string(), name: z.string() }))
        .min(1, "Add at least one GitHub repo")
        .max(MAX_REPOS, `Add at most ${MAX_REPOS} repos`),
    ),
  logoUrl: optionalHttpsUrl,
  discordChannel: z.preprocess(
    blankToUndefined,
    z.string().trim().max(80, "Keep this under 80 characters").optional(),
  ),
  contributingUrl: optionalHttpsUrl,
  expectedMentors: z.coerce
    .number("Enter how many mentors you expect")
    .int("Use a whole number")
    .min(0, "Can't be negative")
    .max(20, "At most 20"),
  license: z.enum(OSI_LICENSES, "Pick the project's license"),
});

/** The whole application, for drafts and applications with changes requested. */
export const projectSchema = projectFields.superRefine((data, ctx) => {
  const total =
    data.difficultyEasy + data.difficultyMedium + data.difficultyHard;
  if (total !== 100) {
    ctx.addIssue({
      code: "custom",
      path: ["difficultyEasy"],
      message: `The three levels should add up to 100% (now ${total}%)`,
    });
  }
});

export type ProjectInput = z.infer<typeof projectSchema>;

/** What a project admin may still change once the project is approved (issue #23). */
export const approvedEditSchema = projectFields.pick({
  description: true,
  techStack: true,
});

/** One repo link, for adding a repo to an approved project. */
export const repoLinkSchema = z
  .string("Paste a GitHub repo link")
  .transform((value, ctx) => {
    const repo = parseRepoUrl(value);
    if (!repo) {
      ctx.addIssue({
        code: "custom",
        message: "Use a GitHub repo link like https://github.com/owner/repo",
      });
      return z.NEVER;
    }
    return repo;
  });

/** Turns the first issue of a failed parse into a field error map. */
export function fieldErrors(error: z.ZodError) {
  const errors: Partial<Record<ProjectField, string>> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form") as ProjectField;
    errors[key] ??= issue.message;
  }
  return errors;
}

/**
 * API bodies may send lists as arrays; the schema reads the form's text shapes (comma-separated
 * tags, one repo per line), so normalise to those.
 */
export function normaliseProjectBody(body: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...body };
  if (Array.isArray(body.techStack)) out.techStack = body.techStack.join(",");
  if (Array.isArray(body.repos)) out.repos = body.repos.join("\n");
  for (const key of [
    "name",
    "description",
    "techStack",
    "repos",
    "logoUrl",
    "discordChannel",
    "contributingUrl",
    "license",
  ]) {
    if (out[key] === undefined || out[key] === null) out[key] = "";
  }
  return out;
}

export type ProjectField =
  | "name"
  | "description"
  | "techStack"
  | "difficultyEasy"
  | "repos"
  | "logoUrl"
  | "discordChannel"
  | "contributingUrl"
  | "expectedMentors"
  | "license"
  | "form";

export type ProjectFormState = {
  errors?: Partial<Record<ProjectField, string>>;
  /** Per-repo problems found on GitHub, keyed "owner/name". */
  repoProblems?: Record<string, string[]>;
  saved?: boolean;
};

/** What the project form starts with. Lives here, not in the client form module, so server
 * components can pass it (a server component importing a value from a "use client" module only
 * gets an opaque reference). */
export type ProjectDefaults = {
  name: string;
  description: string;
  techStack: string;
  difficultyEasy: number;
  difficultyMedium: number;
  difficultyHard: number;
  repos: string;
  logoUrl: string;
  discordChannel: string;
  contributingUrl: string;
  expectedMentors: number;
  license: string;
};

export const EMPTY_PROJECT: ProjectDefaults = {
  name: "",
  description: "",
  techStack: "",
  difficultyEasy: 50,
  difficultyMedium: 35,
  difficultyHard: 15,
  repos: "",
  logoUrl: "",
  discordChannel: "",
  contributingUrl: "",
  expectedMentors: 1,
  license: "MIT",
};
