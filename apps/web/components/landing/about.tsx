import { about } from "@/lib/content";
import { SnowLedge } from "./art/snow-ledge";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Six-armed ice crystal, used as a slowly turning background decoration.
function Crystal({ className }: { className: string }) {
  return (
    <svg
      className={`crystal ${className}`}
      viewBox="-100 -100 200 200"
      aria-hidden="true"
    >
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <path
          key={angle}
          transform={`rotate(${angle})`}
          d="M0 -14V-94M0 -34 -17 -51M0 -34 17 -51M0 -58 -13 -71M0 -58 13 -71M0 -80 -7 -87M0 -80 7 -87"
        />
      ))}
      <path d="M0 -14 12.1 -7 12.1 7 0 14 -12.1 7 -12.1 -7Z" />
    </svg>
  );
}

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
