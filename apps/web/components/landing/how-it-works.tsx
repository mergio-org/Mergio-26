import { steps } from "@/lib/content";
import { SectionHead } from "./section-head";

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
        <div className="steps">
          {steps.map((step) => (
            <div key={step.title} className="step reveal">
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
