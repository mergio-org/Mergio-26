import { links, maintainerChecks } from "@/lib/content";
import { Icon } from "./icon";
import { Eyebrow } from "./section-head";

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
            <div className="hero-cta">
              <a className="btn btn-primary" href={links.submitProject}>
                Submit a project
              </a>
              <a className="btn btn-ghost" href={links.maintainerGuide}>
                Maintainer guide
              </a>
            </div>
          </div>
          <ul className="checks">
            {maintainerChecks.map((check) => (
              <li key={check}>
                <Icon name="check" size={18} />
                {check}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
