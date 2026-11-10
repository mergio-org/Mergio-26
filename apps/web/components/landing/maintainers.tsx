import { links, maintainerChecks, repoPreview } from "@/lib/content";
import { Crystal } from "./art/crystal";
import { pine } from "./art/drift";
import { SnowLedge } from "./art/snow-ledge";
import { Icon } from "./icon";
import { Eyebrow } from "./section-head";

// "mergio:level-2" -> "label l2", so each level gets its own colour.
const labelClass = (label: string) =>
  label.startsWith("mergio:level-") ? `label l${label.slice(-1)}` : "label";

// Contributor avatars cycle through four winter colours (classes a1-a4 in globals.css).
const handles = repoPreview.issues.map((issue) => issue.assignee);
const avatarClass = (handle: string) =>
  `avatar-dot a${(Math.max(handles.indexOf(handle), 0) % 4) + 1}`;
const initial = (handle: string) => handle.charAt(0).toUpperCase();

// What a participating repository looks like during the program. Content comes from repoPreview.
function RepoMock() {
  const { name, openIssues, pullRequests, issues } = repoPreview;
  const [org, repo] = name.split("/");
  const merged = issues.find((issue) => issue.merged);
  return (
    <div className="repo-wrap">
      <div className="repo-frame">
        <SnowLedge id="repo" />
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
              <li
                key={issue.title}
                className={issue.merged ? "merged" : undefined}
              >
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
                <span
                  className={avatarClass(issue.assignee)}
                  title={`@${issue.assignee}`}
                >
                  {initial(issue.assignee)}
                </span>
              </li>
            ))}
          </ul>
        </figure>
      </div>
      {/* Activity that slides in once the section is revealed. */}
      <div className="crowd" aria-hidden="true">
        <span className="crowd-faces">
          {handles.map((handle) => (
            <span key={handle} className={avatarClass(handle)}>
              {initial(handle)}
            </span>
          ))}
        </span>
        Contributors joining
      </div>
      {merged && (
        <div className="repo-toast" aria-hidden="true">
          <span className="toast-icon">
            <Icon name="merge" size={16} />
          </span>
          <span className="toast-text">
            <b>You merged a pull request</b>
            <small>
              @{merged.assignee} · {merged.title}
            </small>
          </span>
        </div>
      )}
    </div>
  );
}

// Pines standing in the snow along the bottom of the panel: [x, base y, height].
const trees = [
  [34, 96, 70],
  [72, 96, 46],
  [118, 96, 58],
  [980, 96, 62],
  [1024, 96, 78],
  [1066, 96, 48],
].map(([x = 0, base = 0, h = 0]) => pine(x, base, h));

function PanelScene() {
  return (
    <svg
      className="maint-scene"
      viewBox="0 0 1100 110"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <path
        className="aw-far"
        d="M0 84C140 62 260 70 400 66S700 54 860 64 1040 70 1100 60V110H0Z"
      />
      <path className="s-pine" d={trees.map((t) => t.body).join("")} />
      <path className="s-cap" d={trees.map((t) => t.caps).join("")} />
      <path
        className="aw-snow"
        d="M0 98C160 86 330 92 520 90S860 84 1100 96V110H0Z"
      />
    </svg>
  );
}

export function Maintainers() {
  return (
    <section className="section" id="maintainers">
      <div className="wrap">
        <div className="maint panel panel-featured reveal">
          <Crystal className="m1" />
          <PanelScene />
          <div>
            <Eyebrow icon="repo">For maintainers</Eyebrow>
            <h2>
              Bring your project to <span>Mergio.</span>
            </h2>
            <p>
              A month of motivated contributors on your open issues, with
              mentors to help you review. Top maintainers win prizes too.
            </p>
            <span className="reqs-label">What we look for</span>
            <ul className="reqs">
              {maintainerChecks.map((check) => (
                <li key={check.text}>
                  <span className="tile-icon">
                    <Icon name={check.icon} size={16} />
                  </span>
                  {check.text}
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
