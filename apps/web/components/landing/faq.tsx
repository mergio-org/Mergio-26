import { faqs, links } from "@/lib/content";
import { SnowLedge } from "./art/snow-ledge";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Native <details> handles open/close, so this stays a server component.
// The open/close animation is CSS-only (::details-content) and falls back to an instant toggle.
export function Faq() {
  return (
    <section className="section" id="faq">
      <div className="wrap faq">
        <div className="faq-side">
          <SectionHead eyebrow="FAQ" title="Questions," accent="answered.">
            Everything you need to know before you join.
          </SectionHead>
          <div className="faq-help panel reveal">
            <SnowLedge id="faq" />
            <span className="tile-icon">
              <Icon name="mentor" size={20} />
            </span>
            <h3>Still have questions?</h3>
            <p>Ask the Mergio team and mentors on Discord.</p>
            <a className="btn btn-primary btn-sm" href={links.discord}>
              Ask on Discord <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <div className="faq-list reveal">
          {faqs.map(({ q, a }, i) => (
            <details key={q} className="faq-item">
              <summary>
                <span className="faq-num">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="faq-q">{q}</span>
                <span className="faq-toggle" aria-hidden="true" />
              </summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
