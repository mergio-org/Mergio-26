import { about } from "@/lib/content";
import { Crystal } from "./art/crystal";
import { SnowLedge } from "./art/snow-ledge";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// One frosted card with the key numbers and the ways to join, over a winter backdrop.
export function About() {
  return (
    <section className="section" id="about">
      <div className="aurora soft bright" aria-hidden="true" />
      <Crystal className="c1" />
      <Crystal className="c2" />
      <Crystal className="c3" />
      <div className="wrap">
        <SectionHead
          eyebrow="About Mergio"
          title="A month of open source,"
          accent="for everyone."
          center
        >
          Students, maintainers and mentors from every college. Free to join.
        </SectionHead>
        <div className="about-card panel reveal">
          <SnowLedge id="about" />
          <ul className="about-stats">
            {about.stats.map((stat) => (
              <li key={stat.value}>
                <Icon name={stat.icon} size={22} />
                <b>{stat.value}</b>
                <span>{stat.label}</span>
              </li>
            ))}
          </ul>
          <nav className="about-join" aria-label="Get involved">
            {about.roles.map((role) => (
              <a key={role.who} className="join-item" href={role.href}>
                <span className="tile-icon">
                  <Icon name={role.icon} size={18} />
                </span>
                <span className="join-text">
                  <small>{role.who}</small>
                  {role.cta}
                </span>
                <span className="join-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}
