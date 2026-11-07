import { steps } from "@/lib/content";
import { Summit } from "./art/summit";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// The steps climb a snowy mountain trail from left to right; the merge is the summit.
// On narrower screens they stack along a vertical trail instead.
export function HowItWorks() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <SectionHead
          eyebrow="How it works"
          title="Four steps from sign-up to"
          accent="leaderboard."
          center
        />
        <div className="journey reveal">
          <Summit />
          <ol className="steps">
            {steps.map((step, i) => (
              <li key={step.title} className="step">
                <span className="step-node">
                  <Icon name={step.icon} size={22} />
                </span>
                <div
                  className={`step-card panel${i === steps.length - 1 ? " panel-featured" : ""}`}
                >
                  <span className="step-num">
                    Step {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
