import { timeline } from "@/lib/content";
import { SectionHead } from "./section-head";

// Star centres in the 600×56 viewBox: one per column, alternating high and low.
const star = (i: number) => `${i * 100 + 50},${i % 2 ? 44 : 12}`;

// The program as a constellation: one star per stage, joined by a dashed line.
// Stages before the active one are drawn as done; the active star pulses.
export function Timeline() {
  const current = timeline.findIndex((stage) => stage.active);
  const allPoints = timeline.map((_, i) => star(i)).join(" ");
  const donePoints = timeline
    .slice(0, current + 1)
    .map((_, i) => star(i))
    .join(" ");

  return (
    <section className="section" id="timeline">
      <div className="wrap">
        <SectionHead eyebrow="Timeline" title="How the program" accent="runs.">
          Exact dates will be announced soon.
        </SectionHead>
        <div className="constellation reveal">
          <svg
            className="constellation-lines"
            viewBox="0 0 600 56"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline points={allPoints} />
            {current > 0 && <polyline className="done" points={donePoints} />}
          </svg>
          <ol className="timeline">
            {timeline.map((stage, i) => {
              const state =
                i === current ? "active" : i < current ? "done" : undefined;
              return (
                <li
                  key={stage.title}
                  className={state}
                  aria-current={state === "active" ? "step" : undefined}
                >
                  <span className="star" aria-hidden="true" />
                  <span className="when">
                    {stage.when ?? `Stage ${String(i + 1).padStart(2, "0")}`}
                  </span>
                  {state === "active" && <span className="now">Now</span>}
                  <h3>{stage.title}</h3>
                  <p>{stage.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
