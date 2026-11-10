import { prizes } from "@/lib/content";
import {
  ContributorsScene,
  EveryoneScene,
  MaintainersScene,
} from "./art/awards";
import { Drift } from "./art/drift";
import { Icon } from "./icon";
import { SectionHead } from "./section-head";

// Three award cards, each topped with a little winter scene. The contributors card comes first
// in the markup (and on phones); on desktop it sits in the middle and rises above the others.
export function Prizes() {
  const { contributors, maintainers, everyone, sponsor } = prizes;
  return (
    <section className="section has-scene" id="prizes">
      <div className="aurora soft" aria-hidden="true" />
      <Drift />
      <div className="wrap">
        <SectionHead
          eyebrow="Prizes & recognition"
          icon="trophy"
          title="Everyone takes"
          accent="something home."
          center
        >
          Prizes for top contributors and maintainers, and a certificate for
          every participant.
        </SectionHead>
        <div className="awards">
          <article className="award award-top panel panel-featured reveal">
            <div className="award-scene tall">
              <ContributorsScene />
            </div>
            <div className="award-body">
              <span className="k">{contributors.kicker}</span>
              <h3>{contributors.title}</h3>
              <p>{contributors.body}</p>
              <ol className="places">
                {contributors.places.map(({ place, prize }, i) => (
                  <li key={place} className={`m${i + 1}`}>
                    <b>{place}</b>
                    {prize ? (
                      <span>{prize}</span>
                    ) : (
                      <span className="soon">Revealing soon</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </article>
          <article className="award award-maint panel reveal">
            <div className="award-scene">
              <MaintainersScene />
            </div>
            <div className="award-body">
              <span className="k">{maintainers.kicker}</span>
              <h3>{maintainers.title}</h3>
              <p>{maintainers.body}</p>
            </div>
          </article>
          <article className="award award-all panel reveal">
            <div className="award-scene">
              <EveryoneScene />
            </div>
            <div className="award-body">
              <span className="k">{everyone.kicker}</span>
              <h3>{everyone.title}</h3>
              <p>{everyone.body}</p>
            </div>
          </article>
        </div>
        <div className="sponsor-bar panel reveal">
          <span className="tile-icon">
            <Icon name="flake" size={18} />
          </span>
          <p>
            <b>{sponsor.title}</b>
            {sponsor.body}
          </p>
          <a className="btn btn-ghost btn-sm" href={sponsor.href}>
            {sponsor.cta} <span aria-hidden="true">→</span>
          </a>
        </div>
        <p className="note">
          Final prizes will be announced with our sponsors.
        </p>
      </div>
    </section>
  );
}
