import { About } from "@/components/landing/about";
import { IconSprite } from "@/components/landing/art/icon-sprite";
import { Faq } from "@/components/landing/faq";
import { FinalCta, OrganiserStrip } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Maintainers } from "@/components/landing/maintainers";
import { Prizes } from "@/components/landing/prizes";
import { Scoring } from "@/components/landing/scoring";
import { ScrollEffects } from "@/components/landing/scroll-effects";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { NightSnow } from "@/components/landing/snow";
import { Timeline } from "@/components/landing/timeline";

export default function HomePage() {
  return (
    <>
      <IconSprite />
      <SiteHeader />
      <main id="top">
        <Hero />
        {/* Continuous winter-night background behind every section below the hero. */}
        <div className="night">
          <About />
          <HowItWorks />
          <Scoring />
          <Timeline />
          <Prizes />
          <Maintainers />
          <Faq />
          <FinalCta />
          <OrganiserStrip />
          {/* Last, so the snow paints in front of the scene art but still behind all content. */}
          <NightSnow />
        </div>
      </main>
      <SiteFooter />
      <ScrollEffects />
    </>
  );
}
