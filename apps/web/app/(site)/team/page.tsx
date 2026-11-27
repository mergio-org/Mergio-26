import { EmptyState, PageHead } from "@/components/site/page-head";
import { getPublicItems } from "@/lib/content-service";
import { organiser } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Team",
  description: `The core team running Mergio at ${organiser}.`,
  path: "/team",
});

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export default async function TeamPage() {
  const team = await getPublicItems("team");
  return (
    <div className="w-full">
      <PageHead title="Core team">The people at {organiser} who run Mergio.</PageHead>
      {team.length ? (
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <li key={`${member.name}-${member.role}`} className="panel flex flex-col items-center p-6 text-center">
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- uploaded photo of unknown size
                <img src={member.photoUrl} alt="" loading="lazy" className="size-24 rounded-full object-cover" />
              ) : (
                <span aria-hidden="true" className="flex size-24 items-center justify-center rounded-full bg-(color:--surface-2) text-2xl font-semibold">
                  {initials(member.name)}
                </span>
              )}
              <p className="mt-4 mb-0 font-semibold">{member.name}</p>
              <p className="mt-1 mb-0 text-sm text-(color:--muted)">{member.role}</p>
              {(member.githubLogin || member.linkedinUrl) && (
                <p className="mt-3 mb-0 flex gap-3 text-sm">
                  {member.githubLogin && (
                    <a className="underline" href={`https://github.com/${member.githubLogin}`} target="_blank" rel="noopener noreferrer">
                      GitHub
                    </a>
                  )}
                  {member.linkedinUrl && (
                    <a className="underline" href={member.linkedinUrl} target="_blank" rel="noopener noreferrer">
                      LinkedIn
                    </a>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Team announced soon">We&apos;re putting the team page together. Check back shortly.</EmptyState>
      )}
    </div>
  );
}
