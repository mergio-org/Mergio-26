import "server-only";
import { prisma } from "@repo/db";
import { isOsiLicense, type RepoRef } from "./projects";

// GitHub REST checks for project applications, run with the applicant's own OAuth token (the
// `read:user user:email` sign-in token is enough to read public repos and the caller's permission
// on them). Nothing here needs repository scopes.

const API = "https://api.github.com";

export type RepoChecks = {
  public: boolean;
  notArchived: boolean;
  osiLicense: boolean;
  readme: boolean;
  contributing: boolean;
  /** The applicant has admin or maintain permission on the repo. */
  permission: boolean;
};

export const CHECK_LABELS: Record<keyof RepoChecks, string> = {
  public: "The repo is public",
  notArchived: "The repo is not archived",
  osiLicense: "It has an OSI-approved license",
  readme: "It has a README",
  contributing: "It has a CONTRIBUTING file",
  permission: "You have admin or maintain permission on it",
};

export type RepoValidation =
  | {
      found: true;
      githubRepoId: bigint;
      /** Current owner and name from GitHub (they may differ from what was typed). */
      owner: string;
      name: string;
      license: string | null;
      checks: RepoChecks;
    }
  | { found: false; reason: string };

export class GitHubAuthError extends Error {}
export class GitHubRateLimitError extends Error {}

/** The signed-in user's GitHub OAuth token, or null if it is missing (they should sign in again). */
export async function githubTokenFor(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "github" },
    select: { accessToken: true },
  });
  return account?.accessToken ?? null;
}

async function gh(path: string, token: string) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "mergio-project-validation",
    },
    cache: "no-store",
  });
  if (response.status === 401) throw new GitHubAuthError("GitHub rejected the sign-in token");
  if (
    (response.status === 403 || response.status === 429) &&
    response.headers.get("x-ratelimit-remaining") === "0"
  ) {
    throw new GitHubRateLimitError("GitHub's rate limit was reached");
  }
  return response;
}

type RepoResponse = {
  id: number;
  name: string;
  owner: { login: string };
  private: boolean;
  archived: boolean;
  fork: boolean;
  license: { spdx_id: string | null } | null;
  permissions?: { admin?: boolean; maintain?: boolean };
};

type CommunityProfile = {
  files?: { readme: unknown; contributing: unknown };
};

/** Looks for README and CONTRIBUTING. The community profile covers both in one call but is not
 * available for every repo (forks, for example), so fall back to the contents API. */
async function docsFor(fullName: string, token: string) {
  const profile = await gh(`/repos/${fullName}/community/profile`, token);
  if (profile.ok) {
    const { files } = (await profile.json()) as CommunityProfile;
    if (files) return { readme: Boolean(files.readme), contributing: Boolean(files.contributing) };
  }
  const exists = async (path: string) => (await gh(`/repos/${fullName}/${path}`, token)).ok;
  const [readme, ...contributing] = await Promise.all([
    exists("readme"),
    exists("contents/CONTRIBUTING.md"),
    exists("contents/.github/CONTRIBUTING.md"),
    exists("contents/docs/CONTRIBUTING.md"),
  ]);
  return { readme, contributing: contributing.some(Boolean) };
}

/** Fetches one repo and runs every application check on it. */
export async function validateRepo(repo: RepoRef, token: string): Promise<RepoValidation> {
  const response = await gh(`/repos/${repo.owner}/${repo.name}`, token);
  if (response.status === 404) {
    return { found: false, reason: "Not found on GitHub. Check the link, and that the repo is public." };
  }
  if (!response.ok) {
    return { found: false, reason: `GitHub answered ${response.status}. Try again in a minute.` };
  }
  const data = (await response.json()) as RepoResponse;
  const fullName = `${data.owner.login}/${data.name}`;
  const docs = await docsFor(fullName, token);
  const license = data.license?.spdx_id ?? null;

  return {
    found: true,
    githubRepoId: BigInt(data.id),
    owner: data.owner.login,
    name: data.name,
    license,
    checks: {
      public: !data.private,
      notArchived: !data.archived,
      osiLicense: isOsiLicense(license),
      readme: docs.readme,
      contributing: docs.contributing,
      permission: Boolean(data.permissions?.admin || data.permissions?.maintain),
    },
  };
}

/** Human-readable problems for a validated repo; empty when every check passed. */
export function problemsOf(validation: RepoValidation): string[] {
  if (!validation.found) return [validation.reason];
  const problems: string[] = [];
  const { checks } = validation;
  if (!checks.public) problems.push("The repo must be public.");
  if (!checks.notArchived) problems.push("The repo is archived.");
  if (!checks.osiLicense) {
    problems.push(
      validation.license && validation.license !== "NOASSERTION"
        ? `Its license (${validation.license}) is not OSI-approved.`
        : "GitHub found no OSI-approved license. Add a LICENSE file.",
    );
  }
  if (!checks.readme) problems.push("Add a README.");
  if (!checks.contributing) problems.push("Add a CONTRIBUTING.md (in the root, .github/ or docs/).");
  if (!checks.permission) {
    problems.push(
      "You need admin or maintain permission on the repo. If it belongs to an organization, an owner may need to approve Mergio's GitHub access for that organization.",
    );
  }
  return problems;
}
