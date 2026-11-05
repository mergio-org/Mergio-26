import { timeline } from "@/lib/content";
import { SectionHead } from "./section-head";

export function Timeline() {
  return (
    <section className="section" id="timeline">
      <div className="wrap">
        <SectionHead eyebrow="Timeline" title="How the program" accent="runs.">
          Exact dates will be announced soon.
        </SectionHead>
        <ol className="timeline reveal">
          {timeline.map((stage) => (
            <li
              key={stage.title}
              className={stage.active ? "active" : undefined}
            >
              <span className="when">{stage.when}</span>
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
