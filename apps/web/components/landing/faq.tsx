import { faqs, links } from "@/lib/content";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Native <details> handles open/close, so this stays a server component.
// The open/close animation is CSS-only (::details-content) and falls back to an instant toggle.
export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="wrap faq">
        <SectionHead eyebrow="FAQ" title="Questions," accent="answered.">
          Still unsure? <a href={links.discord}>Ask us on Discord</a>.
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
