import type { CSSProperties } from "react";
import { timeline } from "@/lib/content";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Snow drifting over the top edge of each stage card.
function SnowCap() {
  return (
    <svg
      className="tl-cap"
      viewBox="0 0 100 10"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 0H100V5C96 5 95 9 90 9C85 9 84 6 78 6C72 6 71 10 64 10C57 10 56 6 50 6C44 6 43 9 37 9C31 9 30 5 24 5C18 5 17 8 11 8C6 8 4 6 0 6Z" />
    </svg>
  );
}

// A frozen trail of six stages: hexagonal ice-crystal nodes joined by a trail (aurora-lit where
// done, flowing dashes from the current stage to the next), each above a snow-capped card.
// Stages before the `active` one render as done. Cards cascade in when the list is revealed.
// Dates: each card has a date pill showing `when` from content.ts, or "Date TBA" until it is set.
// The "Dates to be announced soon" badge under the heading hides once every stage has a date.
export function Timeline() {
  const current = timeline.findIndex((stage) => stage.active);
  const allDated = timeline.every((stage) => stage.when);

  return (
    <section className="section" id="timeline">
      <div className="aurora soft alt" aria-hidden="true" />
      <div className="wrap">
        <SectionHead
          eyebrow="Timeline"
          title="How the program"
          accent="runs."
          center
        >
          Six stages, one winter.
        </SectionHead>
        {!allDated && (
          <p className="tl-tba reveal">
            <span className="tl-tba-dot" aria-hidden="true" />
            <Icon name="calendar" size={14} />
            Dates to be announced soon
          </p>
        )}
        <ol
          className="tl reveal"
          style={{ "--n": timeline.length } as CSSProperties}
        >
          {timeline.map((stage, i) => {
            const state =
              i === current ? "active" : i < current ? "done" : "upcoming";
            return (
              <li
                key={stage.title}
                className={`tl-step ${state}`}
                aria-current={state === "active" ? "step" : undefined}
                style={{ "--i": i } as CSSProperties}
              >
                <span className="tl-node" aria-hidden="true">
                  <span className="tl-hex">
                    <Icon
                      name={state === "done" ? "check" : stage.icon}
                      size={22}
                    />
                  </span>
                </span>
                <div className="tl-card">
                  <SnowCap />
                  <span className="tl-when">
                    Stage {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{stage.title}</h3>
                  <p>{stage.body}</p>
                  <span className={`tl-date${stage.when ? " set" : ""}`}>
                    <Icon name="calendar" size={12} />
                    {stage.when ?? "Date TBA"}
                  </span>
                  {state === "active" && <span className="tl-now">Now</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
