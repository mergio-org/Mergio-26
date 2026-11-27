import { About } from "@/components/landing/about";
import { IconSprite } from "@/components/landing/art/icon-sprite";
import { Faq } from "@/components/landing/faq";
import { FinalCta } from "@/components/landing/final-cta";
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
import { getPublicItems } from "@/lib/content-service";
import { getViewer } from "@/lib/dal";

export default async function HomePage() {
  // Signed-in visitors see "Dashboard" where others see "Register".
  // FAQ, timeline and stats are edited at /admin/content and read on every request.
  const [viewer, faqs, timeline, stats] = await Promise.all([
    getViewer(),
    getPublicItems("faq"),
    getPublicItems("timeline"),
    getPublicItems("stats"),
  ]);
  return (
    <>
      <IconSprite />
      <SiteHeader viewer={viewer} />
      <main id="top">
        <Hero viewer={viewer} />
        {/* Continuous winter-night background behind every section below the hero. */}
        <div className="night">
          <About viewer={viewer} stats={stats} />
          <HowItWorks />
          <Scoring />
          <Timeline timeline={timeline} />
          <Prizes />
          <Maintainers />
          <Faq faqs={faqs} />
          <FinalCta viewer={viewer} />
          {/* Last, so the snow paints in front of the scene art but still behind all content. */}
          <NightSnow />
        </div>
      </main>
      <SiteFooter viewer={viewer} />
      <ScrollEffects />
    </>
  );
}
