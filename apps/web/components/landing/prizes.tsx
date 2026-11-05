import { mainPrize, prizes } from "@/lib/content";
import { SidePines } from "./art/side-pines";
import { SectionHead } from "./section-head";

export function Prizes() {
  return (
    <section className="section" id="prizes">
      <SidePines side="left" />
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
            <div className="places">
              {mainPrize.places.map(({ place, prize }) => (
                <div key={place}>
                  <b>{place}</b>
                  <span>{prize}</span>
                </div>
              ))}
            </div>
          </article>
          {prizes.map((prize) => (
            <article key={prize.kicker} className="prize panel reveal">
              <span className="k">{prize.kicker}</span>
              <h3>{prize.title}</h3>
              <p>{prize.body}</p>
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
