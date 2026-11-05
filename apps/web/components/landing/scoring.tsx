import { levels, rules } from "@/lib/content";
import { Ridge } from "./art/ridge";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

export function Scoring() {
  return (
    <section className="section has-scene" id="scoring">
      <div className="aurora soft alt" aria-hidden="true" />
      <Ridge />
      <div className="wrap">
        <SectionHead
          eyebrow="Scoring"
          title="Clear, fair and"
          accent="transparent."
          center
        >
          Mentors set each issue&apos;s level before it is assigned, so everyone
          knows what it is worth.
        </SectionHead>
        <div className="score-grid">
          {levels.map((item) => (
            <div key={item.level} className="score panel reveal">
              <span className="lv">{item.level}</span>
              <div className="num">
                {item.points}
                <small>pts</small>
              </div>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
        <div className="rules panel reveal">
          {rules.map((rule) => (
            <span key={rule}>
              <Icon name="check" size={18} />
              {rule}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
