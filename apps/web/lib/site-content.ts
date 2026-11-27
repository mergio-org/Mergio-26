// Editable public-site content (F-16): what organizers can change from /admin/content without a
// deploy. Plain data and pure functions only, so the admin editor (a client component), the API
// routes and the public pages all share one definition of every field and its validation.
//
// List content (FAQ, timeline, sponsors, team, home stats) is stored as ContentItem rows whose
// `data` follows the fields below. Long-form pages are ContentPage rows. Until an organizer adds
// rows for a kind, the public site shows the built-in copy from lib/content.ts.

import type { IconName } from "@/components/landing/icon";
import { about, faqs, timeline } from "./content";

export const CONTENT_ICONS = [
  "flake",
  "github",
  "check",
  "merge",
  "pr",
  "repo",
  "issue",
  "mentor",
  "trophy",
  "calendar",
  "clock",
  "sprout",
  "chart",
  "award",
  "help",
] as const satisfies readonly IconName[];

export const SPONSOR_TIERS = [
  { value: "platinum", label: "Platinum" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "community", label: "Community partner" },
] as const;
export type SponsorTier = (typeof SPONSOR_TIERS)[number]["value"];

export type Field =
  | { name: string; label: string; type: "text"; required?: boolean; max: number; hint?: string }
  | { name: string; label: string; type: "markdown"; required?: boolean; max: number; hint?: string }
  | { name: string; label: string; type: "url" | "image"; required?: boolean; hint?: string }
  | {
      name: string;
      label: string;
      type: "select";
      required?: boolean;
      options: readonly { value: string; label: string }[];
      hint?: string;
    }
  | { name: string; label: string; type: "checkbox"; hint?: string };

const iconOptions = CONTENT_ICONS.map((icon) => ({ value: icon, label: icon }));

export const CONTENT_KINDS = {
  faq: {
    db: "FAQ",
    label: "FAQ",
    singular: "question",
    titleField: "question",
    fields: [
      { name: "question", label: "Question", type: "text", required: true, max: 200 },
      { name: "answer", label: "Answer", type: "markdown", required: true, max: 4000 },
    ],
  },
  timeline: {
    db: "TIMELINE",
    label: "Timeline",
    singular: "stage",
    titleField: "title",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, max: 80 },
      { name: "body", label: "Description", type: "text", required: true, max: 300 },
      { name: "icon", label: "Icon", type: "select", required: true, options: iconOptions },
      { name: "when", label: "Date", type: "text", max: 40, hint: 'e.g. "Dec 1". Empty shows "Date TBA".' },
      {
        name: "active",
        label: "This stage is in progress",
        type: "checkbox",
        hint: "Earlier stages show as done. If several are ticked, the first counts.",
      },
    ],
  },
  sponsors: {
    db: "SPONSOR",
    label: "Sponsors",
    singular: "sponsor",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      { name: "tier", label: "Tier", type: "select", required: true, options: SPONSOR_TIERS },
      { name: "logoUrl", label: "Logo", type: "image" },
      { name: "url", label: "Website", type: "url" },
      { name: "blurb", label: "One-line description", type: "text", max: 160 },
    ],
  },
  team: {
    db: "TEAM",
    label: "Core team",
    singular: "team member",
    titleField: "name",
    fields: [
      { name: "name", label: "Name", type: "text", required: true, max: 80 },
      { name: "role", label: "Role", type: "text", required: true, max: 80, hint: 'e.g. "Lead organizer"' },
      { name: "photoUrl", label: "Photo", type: "image" },
      { name: "githubLogin", label: "GitHub username", type: "text", max: 39 },
      { name: "linkedinUrl", label: "LinkedIn URL", type: "url" },
    ],
  },
  stats: {
    db: "STAT",
    label: "Home stats",
    singular: "stat",
    titleField: "value",
    fields: [
      { name: "value", label: "Value", type: "text", required: true, max: 24, hint: 'e.g. "48 h"' },
      { name: "label", label: "Label", type: "text", required: true, max: 60 },
      { name: "icon", label: "Icon", type: "select", required: true, options: iconOptions },
    ],
  },
} as const satisfies Record<
  string,
  { db: string; label: string; singular: string; titleField: string; fields: readonly Field[] }
>;

export type ContentKindKey = keyof typeof CONTENT_KINDS;
export const CONTENT_KIND_KEYS = Object.keys(CONTENT_KINDS) as ContentKindKey[];

export function parseKind(value: unknown): ContentKindKey | null {
  return CONTENT_KIND_KEYS.find((key) => key === value) ?? null;
}

export type FaqData = { question: string; answer: string };
export type TimelineData = { title: string; body: string; icon: IconName; when?: string; active?: boolean };
export type SponsorData = { name: string; tier: SponsorTier; logoUrl?: string; url?: string; blurb?: string };
export type TeamData = { name: string; role: string; photoUrl?: string; githubLogin?: string; linkedinUrl?: string };
export type StatData = { value: string; label: string; icon: IconName };

export type ContentData = {
  faq: FaqData;
  timeline: TimelineData;
  sponsors: SponsorData;
  team: TeamData;
  stats: StatData;
};

export type ContentItemJson<K extends ContentKindKey = ContentKindKey> = {
  id: string;
  kind: K;
  position: number;
  data: ContentData[K];
  updatedAt: string;
};

/** Built-in copy each kind shows until organizers add their own. */
export const DEFAULT_ITEMS: { [K in ContentKindKey]: ContentData[K][] } = {
  faq: faqs.map(({ q, a }) => ({ question: q, answer: a })),
  timeline: timeline.map(({ title, body, icon, when, active }) => ({
    title,
    body,
    icon,
    ...(when ? { when } : {}),
    ...(active ? { active } : {}),
  })),
  sponsors: [],
  team: [],
  stats: about.stats.map(({ value, label, icon }) => ({ value, label, icon })),
};

type Validated = { ok: true; data: Record<string, unknown> } | { ok: false; errors: Record<string, string> };

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Checks `input` against a kind's fields and returns clean data (strings trimmed, empty optional
 * fields dropped, unknown keys ignored) or an error per field.
 */
export function validateItem(kind: ContentKindKey, input: Record<string, unknown>): Validated {
  const data: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const field of CONTENT_KINDS[kind].fields as readonly Field[]) {
    const raw = input[field.name];
    if (field.type === "checkbox") {
      if (raw === true || raw === "on" || raw === "true") data[field.name] = true;
      continue;
    }
    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      errors[field.name] = `${field.label} must be text.`;
      continue;
    }
    const value = (raw ?? "").trim();
    if (!value) {
      if (field.required) errors[field.name] = `${field.label} is required.`;
      continue;
    }
    switch (field.type) {
      case "text":
      case "markdown":
        if (value.length > field.max) {
          errors[field.name] = `${field.label} must be at most ${field.max} characters.`;
          continue;
        }
        break;
      case "url":
      case "image":
        if (!isHttpUrl(value) || value.length > 2048) {
          errors[field.name] = `${field.label} must be an http(s) URL.`;
          continue;
        }
        break;
      case "select":
        if (!field.options.some((option) => option.value === value)) {
          errors[field.name] = `Choose a valid ${field.label.toLowerCase()}.`;
          continue;
        }
        break;
    }
    if (field.name === "githubLogin" && !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(value)) {
      errors[field.name] = "That isn't a valid GitHub username.";
      continue;
    }
    data[field.name] = value;
  }

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

// ---------------------------------------------------------------------------
// Long-form pages
// ---------------------------------------------------------------------------

export const PAGE_SLUGS = ["about", "code-of-conduct", "privacy", "terms"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export function parsePageSlug(value: unknown): PageSlug | null {
  return PAGE_SLUGS.find((slug) => slug === value) ?? null;
}

export type PageContent = { slug: PageSlug; title: string; description: string; body: string; updatedAt: string | null };

export const PAGE_LIMITS = { title: 120, description: 300, body: 50_000 };

export function validatePage(
  input: Record<string, unknown>,
): { ok: true; data: { title: string; description: string; body: string } } | { ok: false; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const read = (name: keyof typeof PAGE_LIMITS, label: string, required: boolean) => {
    const raw = input[name];
    if (raw !== undefined && typeof raw !== "string") {
      errors[name] = `${label} must be text.`;
      return "";
    }
    const value = (raw ?? "").trim();
    if (required && !value) errors[name] = `${label} is required.`;
    else if (value.length > PAGE_LIMITS[name]) {
      errors[name] = `${label} must be at most ${PAGE_LIMITS[name].toLocaleString("en")} characters.`;
    }
    return value;
  };
  const data = {
    title: read("title", "Title", true),
    description: read("description", "Description", false),
    body: read("body", "Body", true),
  };
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

/** Built-in page copy, shown until an organizer saves the page. Values in [brackets] are placeholders. */
export const DEFAULT_PAGES: Record<PageSlug, Omit<PageContent, "slug" | "updatedAt">> = {
  about: {
    title: "About Mergio",
    description:
      "Mergio is a month-long winter open-source program by GDG on Campus KNIT Sultanpur, open to everyone.",
    body: `Mergio is a month-long winter open-source program organised by **GDG on Campus KNIT Sultanpur**. Students, maintainers and mentors from every college work together on real open-source projects.

## Why we run it

Most students never get past their first pull request. Mergio gives them a month, a curated list of beginner-friendly projects and mentors who answer questions, so the first contribution is the start rather than the end.

## How it works

1. **Register with GitHub.** Your merged pull requests are tracked automatically.
2. **Choose a project** from the approved list.
3. **Solve a labelled issue** and open a pull request.
4. **Get merged** and earn 10, 25 or 45 points depending on the issue level.

## Who can join

Anyone. Mergio is free, and Level 1 issues are designed for first-time contributors.`,
  },
  "code-of-conduct": {
    title: "Code of conduct",
    description: "How everyone taking part in Mergio is expected to behave.",
    body: `Mergio is for everyone. We want it to be a welcoming, harassment-free experience regardless of background, identity, experience level or college.

## Expected behaviour

- Be kind and patient, especially with first-time contributors.
- Give and accept constructive feedback gracefully.
- Respect maintainers' time and their decisions about their projects.
- Credit other people's work.

## Unacceptable behaviour

- Harassment, insults or discriminatory language, in any channel.
- Spam pull requests, low-effort changes made only for points, or plagiarised code.
- Claiming issues you are not working on, or pressuring maintainers to merge.

## Program rules

- Only merged pull requests on approved repositories earn points.
- You may hold up to 2 assigned issues at a time.
- Spam leads to disqualification.

## Reporting

Report a problem to the organizers at [contact email] or privately on Discord. Reports are handled confidentially. Organizers may warn, suspend scoring for, or remove anyone who breaks this code.`,
  },
  privacy: {
    title: "Privacy policy",
    description: "What Mergio collects about you and how it is used.",
    body: `*Last updated: [date]*

## What we collect

- **From GitHub**, when you sign in: your username, name, avatar and email address, and public activity (pull requests and issues) on approved repositories.
- **From the registration form**: your college, graduation year and any contact details you choose to give.

## How we use it

To run the program: tracking contributions, computing the leaderboards, sending program emails and issuing certificates. Your username, college and points appear on the public leaderboard.

## Sharing

We do not sell your data. Sponsors receive it only if you opt in. Data is stored with our hosting providers.

## Your choices

You can ask us to correct or delete your data at any time by writing to [contact email].`,
  },
  terms: {
    title: "Terms of participation",
    description: "The terms that apply to everyone taking part in Mergio.",
    body: `*Last updated: [date]*

By registering for Mergio you agree to these terms and to the [code of conduct](/code-of-conduct).

1. Participation is free and voluntary.
2. Contributions remain under the license of the project you contribute to.
3. Organizers decide how points are awarded and may adjust scores that break the rules.
4. Prizes depend on eligibility checks and availability, and may change.
5. Organizers may remove participants who break the rules or the code of conduct.
6. These terms may be updated; changes are posted on this page.`,
  },
};
