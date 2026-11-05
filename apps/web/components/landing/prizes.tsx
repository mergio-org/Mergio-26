import { mainPrize, prizes } from "@/lib/content";
import { Drift } from "./art/drift";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Snow drifting over the top edge of each podium block.
function SnowCap() {
  return (
    <svg
      className="cap"
      viewBox="0 0 100 14"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 0H100V7C96 7 95 12 90 12C85 12 84 8 78 8C72 8 71 13 64 13C57 13 56 8 50 8C44 8 43 12 37 12C31 12 30 7 24 7C18 7 17 11 11 11C6 11 4 8 0 8Z" />
    </svg>
  );
}

export function Prizes() {
  return (
    <section className="section has-scene" id="prizes">
      <div className="aurora soft" aria-hidden="true" />
      <Drift />
      <div className="wrap">
        <SectionHead
          eyebrow="Prizes & recognition"
          title="Your work,"
          accent="recognised."
          center
        />
        <div className="prizes">
          <article className="prize main panel panel-featured reveal">
            <span className="k">{mainPrize.kicker}</span>
            <h3>{mainPrize.title}</h3>
            <p>{mainPrize.body}</p>
            {/* Listed 1st, 2nd, 3rd for screen readers; CSS arranges them 2nd, 1st, 3rd. */}
            <ol className="podium">
              {mainPrize.places.map(({ place, prize }, i) => (
                <li key={place} className={`place-${i + 1}`}>
                  {i === 0 && (
                    <Icon name="trophy" size={28} className="trophy" />
                  )}
                  <SnowCap />
                  <b>{place}</b>
                  {prize ? (
                    <span>{prize}</span>
                  ) : (
                    <span className="soon">Revealing soon</span>
                  )}
                </li>
              ))}
            </ol>
          </article>
          {prizes.map((prize) => (
            <article
              key={prize.kicker}
              className={`prize panel reveal${prize.href ? " prize-cta" : ""}`}
            >
              <span className="k">{prize.kicker}</span>
              <h3>{prize.title}</h3>
              <p>{prize.body}</p>
              {prize.href && (
                <a className="prize-link" href={prize.href}>
                  {prize.cta} <span aria-hidden="true">→</span>
                </a>
              )}
            </article>
          ))}
        </div>
        <p className="note">
          Final prizes will be announced with our sponsors.
        </p>
      </div>
    </section>
  );
}
