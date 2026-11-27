import type { Metadata } from "next";
import Link from "next/link";
import { getPage, listItems, listSponsorInquiries } from "@/lib/content-service";
import { requireAdmin } from "@/lib/dal";
import { formatDateTime } from "@/lib/format";
import {
  CONTENT_KIND_KEYS,
  CONTENT_KINDS,
  DEFAULT_ITEMS,
  PAGE_SLUGS,
  parseKind,
  parsePageSlug,
} from "@/lib/site-content";
import { uploadsConfigured } from "@/lib/uploads";
import { ItemEditor } from "./item-editor";
import { PageEditor } from "./page-editor";

export const metadata: Metadata = { title: "Site content — Mergio" };

const PAGE_LABELS = { about: "About", "code-of-conduct": "Code of conduct", privacy: "Privacy", terms: "Terms" } as const;

// Where each kind shows up on the public site.
const SHOWN_ON = {
  faq: [{ href: "/#faq", label: "Home" }, { href: "/faq", label: "/faq" }],
  timeline: [{ href: "/#timeline", label: "Home" }],
  sponsors: [{ href: "/sponsors", label: "/sponsors" }],
  team: [{ href: "/team", label: "/team" }],
  stats: [{ href: "/#about", label: "Home" }],
} as const;

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const tab = params.tab === "pages" || params.tab === "inquiries" ? params.tab : (parseKind(params.tab) ?? "faq");

  const tabs = [
    ...CONTENT_KIND_KEYS.map((key) => ({ key, label: CONTENT_KINDS[key].label })),
    { key: "pages", label: "Pages" },
    { key: "inquiries", label: "Sponsor inquiries" },
  ];

  return (
    <div className="w-full min-w-0">
      <h1 className="text-4xl leading-tight font-semibold tracking-tight">Site content</h1>
      <p className="mt-2 max-w-xl text-(color:--muted)">
        Edit what the public site shows. Changes are live as soon as you save — no deploy needed.
      </p>
      {!uploadsConfigured() && (
        <p className="mt-3 max-w-xl text-sm text-(color:--dim)">
          Image uploads are off until the S3_* environment variables are set; you can still paste image URLs.
        </p>
      )}

      <nav aria-label="Content sections" className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/content?tab=${t.key}`}
            aria-current={t.key === tab ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              t.key === tab
                ? "border-(color:--ice) bg-(color:--ice-soft) text-(color:--text)"
                : "border-(color:--border-strong) text-(color:--muted) hover:text-(color:--text)"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <section className="panel mt-6 p-5 sm:p-8">
        {tab === "pages" ? (
          <PagesTab slugParam={params.page} />
        ) : tab === "inquiries" ? (
          <InquiriesTab user={user} />
        ) : (
          <>
            <p className="mt-0 mb-5 text-sm text-(color:--muted)">
              Shown on{" "}
              {SHOWN_ON[tab].map((place, i) => (
                <span key={place.href}>
                  {i > 0 && ", "}
                  <a className="underline" href={place.href} target="_blank" rel="noopener">
                    {place.label}
                  </a>
                </span>
              ))}
              .
            </p>
            <ItemEditor
              key={tab}
              kind={tab}
              items={await listItems(tab)}
              defaults={DEFAULT_ITEMS[tab] as Record<string, unknown>[]}
            />
          </>
        )}
      </section>
    </div>
  );
}

async function PagesTab({ slugParam }: { slugParam?: string }) {
  const slug = parsePageSlug(slugParam) ?? "about";
  const page = await getPage(slug);
  return (
    <>
      <nav aria-label="Pages" className="mb-6 flex flex-wrap gap-2">
        {PAGE_SLUGS.map((s) => (
          <Link
            key={s}
            href={`/admin/content?tab=pages&page=${s}`}
            aria-current={s === slug ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-sm ${s === slug ? "bg-(color:--ice-soft) text-(color:--text)" : "text-(color:--muted) hover:text-(color:--text)"}`}
          >
            {PAGE_LABELS[s]}
          </Link>
        ))}
      </nav>
      {!page.updatedAt && (
        <p className="mt-0 mb-4 text-sm text-(color:--dim)">This page shows the built-in copy until you publish it.</p>
      )}
      <PageEditor key={`${slug}-${page.updatedAt}`} page={page} />
    </>
  );
}

async function InquiriesTab({ user }: { user: Parameters<typeof listSponsorInquiries>[0] }) {
  const result = await listSponsorInquiries(user);
  if (!result.ok) return <p className="m-0">{result.message}</p>;
  if (!result.data.length) {
    return <p className="m-0 text-(color:--muted)">No one has used the &quot;Become a sponsor&quot; form yet.</p>;
  }
  return (
    <ul className="m-0 list-none p-0">
      {result.data.map((inquiry) => (
        <li key={inquiry.id} className="border-b border-(color:--border) py-4 first:pt-0 last:border-b-0 last:pb-0">
          <p className="m-0 font-medium">
            {inquiry.organization} · {inquiry.name}{" "}
            <a className="text-sm font-normal underline" href={`mailto:${inquiry.email}`}>
              {inquiry.email}
            </a>
          </p>
          <p className="mt-1 mb-1 whitespace-pre-wrap text-(color:--muted)">{inquiry.message}</p>
          <p className="m-0 text-sm text-(color:--dim)">{formatDateTime(inquiry.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
