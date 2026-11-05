import { steps } from "@/lib/content";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Four icon nodes on a trail that ends at the merge. The trail is drawn in CSS (.steps::before/::after).
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
        <ol className="steps reveal">
          {steps.map((step, i) => (
            <li key={step.title} className="step">
              <span className="step-node">
                <Icon name={step.icon} size={22} />
              </span>
              <span className="step-num">
                Step {String(i + 1).padStart(2, "0")}
              </span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
