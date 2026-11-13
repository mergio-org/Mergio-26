import { heroHighlights, links } from "@/lib/content";
import { DayClouds } from "./art/day-clouds";
import { HeroTrees } from "./art/hero-trees";
import { Horizon } from "./art/horizon";
import { Moon } from "./art/moon";
import { Stars } from "./art/stars";
import { WinterScene } from "./art/winter-scene";
import { Icon } from "./icon";
import { HeroSnow } from "./snow";
import { GdgLogo } from "./gdg-logo";

export function Hero() {
  return (
    <section className="hero">
      <div className="aurora" aria-hidden="true" />
      <Stars />
      <div className="day-sun" aria-hidden="true" />
      <DayClouds />
      <Moon />
      <Horizon />
      <HeroTrees />
      <HeroSnow />
      <WinterScene />

      <div className="wrap hero-inner">
        <span className="pill">
          <b>Winter edition</b>Registrations opening soon
        </span>
        <GdgLogo className="presents-logo" />
        <p className="presents">presents</p>
        <h1 className="wordmark">Mergio</h1>
        <p className="tagline">
          Contribute to open source <span>this winter.</span>
        </p>
        <p className="lead">
          A month-long open-source program for students everywhere. Build,
          learn, and climb the leaderboard with every merged pull request.
        </p>
        <div className="hero-cta">
          <a className="btn btn-primary" href={links.register}>
            <Icon name="github" size={18} />
            Register with GitHub
          </a>
          <a className="btn btn-ghost" href="#how">
            How it works
          </a>
        </div>
        <div className="hero-meta">
          {heroHighlights.map((item) => (
            <span key={item}>
              <Icon name="check" size={16} />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
