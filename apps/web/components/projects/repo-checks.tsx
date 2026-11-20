import { CHECK_LABELS, type RepoChecks as Checks } from "@/lib/github";
import { repoUrl } from "@/lib/projects";

type StoredValidation = { license: string | null; checks: Checks } | null;

type Repo = {
  id: string;
  owner: string;
  name: string;
  validation: unknown;
  validatedAt: Date | null;
};

/** True when every repo has been checked and passed everything. */
export function allReposPassed(repos: Repo[]) {
  return (
    repos.length > 0 &&
    repos.every((repo) => {
      const stored = repo.validation as StoredValidation;
      return !!stored && Object.values(stored.checks).every(Boolean);
    })
  );
}

/** Each repo's stored GitHub checks (from the last save or submit), with pass/fail marks. */
export function RepoChecks({ repos, footnote }: { repos: Repo[]; footnote?: string }) {
  const times = repos.flatMap((repo) => (repo.validatedAt ? [repo.validatedAt.getTime()] : []));
  const checkedAt = times.length
    ? new Date(Math.max(...times)).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <>
      <ul className="mt-4 mb-0 list-none space-y-4 p-0">
        {repos.map((repo) => {
          const stored = repo.validation as StoredValidation;
          return (
            <li key={repo.id}>
              <a
                href={repoUrl(repo)}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-sm text-(color:--ice) hover:underline"
              >
                {repo.owner}/{repo.name}
              </a>
              {stored?.license && (
                <span className="ml-2 font-mono text-xs text-(color:--dim)">{stored.license}</span>
              )}
              {stored ? (
                <ul className="mt-1.5 mb-0 grid list-none gap-x-6 gap-y-1 p-0 text-sm sm:grid-cols-2">
                  {(Object.keys(CHECK_LABELS) as (keyof Checks)[]).map((check) => (
                    <li
                      key={check}
                      className={stored.checks[check] ? "text-(color:--muted)" : "text-(color:--gold)"}
                    >
                      <span aria-hidden="true">{stored.checks[check] ? "✓" : "✗"}</span>{" "}
                      {CHECK_LABELS[check]}
                      <span className="sr-only">{stored.checks[check] ? ": passed" : ": not yet"}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-sm text-(color:--muted)">Not checked yet.</p>
              )}
            </li>
          );
        })}
      </ul>
      {checkedAt && (
        <p className="mt-4 text-xs text-(color:--dim)">
          Last checked {checkedAt}.{footnote ? ` ${footnote}` : ""}
        </p>
      )}
    </>
  );
}
