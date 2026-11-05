import { faqs } from "@/lib/content";
import { SidePines } from "./art/side-pines";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Native <details> handles open/close, so this stays a server component.
export function Faq() {
  return (
    <section className="section" id="faq">
      <SidePines side="right" />
      <div className="wrap faq">
        <SectionHead eyebrow="FAQ" title="Questions," accent="answered.">
          Still unsure? Ask us on Discord.
        </SectionHead>
        <div className="faq-list panel reveal">
          {faqs.map(({ q, a }) => (
            <details key={q}>
              <summary>
                {q}
                <Icon name="chev" size={20} className="chev" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
