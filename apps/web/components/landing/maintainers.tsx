import { links, maintainerChecks, repoPreview } from "@/lib/content";
import { Icon } from "./icon";
import { Eyebrow } from "./section-head";

// "mergio:level-2" -> "label l2", so each level gets its own colour.
const labelClass = (label: string) =>
  label.startsWith("mergio:level-") ? `label l${label.slice(-1)}` : "label";

// What a participating repository looks like during the program. Content comes from repoPreview.
function RepoMock() {
  const { name, openIssues, pullRequests, issues } = repoPreview;
  const [org, repo] = name.split("/");
  return (
    <figure className="repo">
      <figcaption className="repo-head">
        <Icon name="repo" size={16} />
        <span>
          {org}/<b>{repo}</b>
        </span>
        <span className="repo-badge">
          <Icon name="flake" size={11} />
          Mergio
        </span>
      </figcaption>
      <div className="repo-tabs" aria-hidden="true">
        <span className="on">
          <Icon name="issue" size={14} />
          {openIssues} Open
        </span>
        <span>
          <Icon name="pr" size={14} />
          {pullRequests} Pull requests
        </span>
      </div>
      <ul className="repo-issues">
        {issues.map((issue) => (
          <li key={issue.title} className={issue.merged ? "merged" : undefined}>
            <Icon name={issue.merged ? "merge" : "issue"} size={16} />
            <div>
              <span className="repo-title">{issue.title}</span>
              <span className="labels">
                {issue.labels.map((label) => (
                  <span key={label} className={labelClass(label)}>
                    {label}
                  </span>
                ))}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

export function Maintainers() {
  return (
    <section className="section" id="maintainers">
      <div className="wrap">
        <div className="maint panel panel-featured reveal">
          <div>
            <Eyebrow>For maintainers</Eyebrow>
            <h2>
              Bring your project to <span>Mergio.</span>
            </h2>
            <p>
              Get motivated contributors working on your open issues for a full
              month, with mentors from our side to help with reviews.
            </p>
            <ul className="checks">
              {maintainerChecks.map((check) => (
                <li key={check}>
                  <Icon name="check" size={18} />
                  {check}
                </li>
              ))}
            </ul>
            <div className="hero-cta">
              <a className="btn btn-primary" href={links.submitProject}>
                Submit a project
              </a>
              <a className="btn btn-ghost" href={links.maintainerGuide}>
                Maintainer guide
              </a>
            </div>
          </div>
          <RepoMock />
        </div>
      </div>
    </section>
  );
}
