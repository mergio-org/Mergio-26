import { EmptyState, PageHead } from "@/components/site/page-head";
import { getPublicItems } from "@/lib/content-service";
import { pageMetadata } from "@/lib/seo";
import { SPONSOR_TIERS } from "@/lib/site-content";
import { SponsorForm } from "./sponsor-form";

export const metadata = pageMetadata({
  title: "Sponsors",
  description: "The organisations supporting Mergio, and how to become a sponsor.",
  path: "/sponsors",
});

const LOGO_SIZE = { platinum: "h-20", gold: "h-16", silver: "h-12", community: "h-10" } as const;

export default async function SponsorsPage() {
  const sponsors = await getPublicItems("sponsors");
  const tiers = SPONSOR_TIERS.map((tier) => ({
    ...tier,
    sponsors: sponsors.filter((sponsor) => sponsor.tier === tier.value),
  })).filter((tier) => tier.sponsors.length);

  return (
    <div className="w-full">
      <PageHead title="Sponsors">Mergio is free for everyone thanks to the organisations below.</PageHead>

      {tiers.length ? (
        <div className="flex flex-col gap-8">
          {tiers.map((tier) => (
            <section key={tier.value} aria-labelledby={`tier-${tier.value}`}>
              <h2 id={`tier-${tier.value}`} className="mb-3 text-sm font-semibold tracking-wider text-(color:--muted) uppercase">
                {tier.label}
              </h2>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[480px]:grid-cols-2 lg:grid-cols-3">
                {tier.sponsors.map((sponsor) => {
                  const inner = (
                    <>
                      {sponsor.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- uploaded logo of unknown size
                        <img src={sponsor.logoUrl} alt={sponsor.name} loading="lazy" className={`${LOGO_SIZE[sponsor.tier]} w-auto max-w-full object-contain`} />
                      ) : (
                        <span className="text-xl font-semibold">{sponsor.name}</span>
                      )}
                      {sponsor.blurb && <span className="mt-3 text-sm text-(color:--muted)">{sponsor.blurb}</span>}
                    </>
                  );
                  return (
                    <li key={sponsor.name}>
                      {sponsor.url ? (
                        <a href={sponsor.url} target="_blank" rel="noopener noreferrer sponsored" className="panel flex h-full flex-col items-center justify-center p-6 text-center">
                          {inner}
                        </a>
                      ) : (
                        <div className="panel flex h-full flex-col items-center justify-center p-6 text-center">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState title="Sponsors to be announced">Want to be the first? Get in touch below.</EmptyState>
      )}

      <section id="become" aria-labelledby="become-title" className="panel mt-10 scroll-mt-24 p-6 sm:p-8">
        <h2 id="become-title" className="m-0 text-2xl font-semibold">Become a sponsor</h2>
        <p className="mt-2 mb-6 max-w-2xl text-(color:--muted)">
          Support hundreds of students making their first open-source contributions. Tell us a little about your
          organisation and we&apos;ll send you the sponsorship deck.
        </p>
        <SponsorForm />
      </section>
    </div>
  );
}
