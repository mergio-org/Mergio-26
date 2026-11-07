import { about } from "@/lib/content";
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

// Icicles hanging under the snow ledge: [x, length] in the 1000×40 viewBox.
const icicles = [
  [42, 14],
  [78, 22],
  [104, 10],
  [170, 18],
  [236, 12],
  [262, 21],
  [330, 9],
  [392, 17],
  [418, 11],
  [486, 20],
  [548, 13],
  [574, 19],
  [640, 10],
  [702, 22],
  [730, 12],
  [796, 16],
  [858, 21],
  [884, 9],
  [944, 15],
]
  .map(([x = 0, len = 0], i) => {
    const w = 3 + (i % 3);
    return `M${x - w} 16L${x} ${16 + len}L${x + w} 16Z`;
  })
  .join("");

// Snow piled along the top edge of the card, with icicles hanging from it.
function SnowLedge() {
  return (
    <svg
      className="ledge"
      viewBox="0 0 1000 40"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="icicle-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".7" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="icicles" d={icicles} />
      <path
        className="snow"
        d="M0 16C30 6 60 4 100 8 140 12 170 3 220 5 270 7 300 2 350 6 400 10 440 3 490 4 540 5 580 9 620 6 660 3 700 2 750 6 800 10 840 4 890 5 940 6 970 9 1000 14V18C980 18 975 22 965 22 955 22 950 18 930 18H700C690 18 686 23 676 23 666 23 662 18 652 18H400C390 18 386 22 377 22 368 22 365 18 355 18H120C110 18 106 23 97 23 88 23 85 18 75 18H0Z"
      />
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
          <SnowLedge />
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
