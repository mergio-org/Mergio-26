// All copy for the landing page. Values in [brackets] are placeholders until they are finalised.

import type { IconName } from "@/components/landing/icon";

export const links = {
  register: "/register",
  githubSignIn: "/register",
  submitProject: "/register?role=maintainer",
  mentor: "/register?role=mentor",
  maintainerGuide: "#",
  sponsor: "#",
  discord: "#",
  rules: "#",
  codeOfConduct: "#",
  instagram: "#",
  linkedin: "#",
};

export const navItems = [
  { id: "about", label: "About" },
  { id: "how", label: "How it works" },
  { id: "scoring", label: "Scoring" },
  { id: "timeline", label: "Timeline" },
  { id: "prizes", label: "Prizes" },
  { id: "faq", label: "FAQ" },
] as const;

export const heroHighlights = [
  "One month",
  "Free to join",
  "Open to everyone",
  "Beginner friendly",
];

// Kept deliberately short: the hero, Scoring and Maintainers sections carry the detail.
export const about = {
  stats: [
    { value: "1 month", label: "of open source", icon: "calendar" as const },
    {
      value: "Unlimited",
      label: "projects to pick from",
      icon: "repo" as const,
    },
    { value: "48 h", label: "review turnaround", icon: "clock" as const },
    { value: "100%", label: "get a certificate", icon: "award" as const },
  ],
  roles: [
    {
      who: "Students",
      cta: "Register",
      href: links.register,
      icon: "pr" as const,
    },
    {
      who: "Maintainers",
      cta: "Submit a project",
      href: links.submitProject,
      icon: "repo" as const,
    },
    {
      who: "Mentors",
      cta: "Become a mentor",
      href: links.mentor,
      icon: "mentor" as const,
    },
  ],
};

export const steps = [
  {
    title: "Register with GitHub",
    body: "Sign in once. Your contributions are tracked automatically.",
    icon: "github" as const,
  },
  {
    title: "Choose a project",
    body: "Pick a repository that matches your skills.",
    icon: "repo" as const,
  },
  {
    title: "Solve an issue",
    body: "Grab a labelled issue and open a pull request, with mentors to help.",
    icon: "issue" as const,
  },
  {
    title: "Get merged",
    body: "Points land on your profile the moment it's merged.",
    icon: "merge" as const,
  },
];

// Levels are shown as ski runs: `run` picks the difficulty marker (green circle, blue square, diamond).
export const levels = [
  {
    level: "Level 1",
    tier: "Easy",
    run: "circle",
    points: 10,
    body: "Documentation, typo fixes, small UI fixes and tests.",
  },
  {
    level: "Level 2",
    tier: "Intermediate",
    run: "square",
    points: 25,
    body: "Bug fixes, small features and refactoring.",
  },
  {
    level: "Level 3",
    tier: "Expert",
    run: "diamond",
    points: 45,
    body: "Major features, performance and architecture work.",
  },
];

export const rules = [
  "Only merged pull requests count",
  "Approved repositories only",
  "Up to 2 assigned issues at a time",
  "Spam leads to disqualification",
];

// Sample rows for the leaderboard preview in Scoring. Illustrative only, labelled "Sample" in the UI.
export const leaderboardPreview = {
  tabs: ["Overall", "Weekly", "College", "First-timers"],
  rows: [
    { handle: "aurora-dev", merged: 14, points: 420 },
    { handle: "pinecone", merged: 12, points: 385 },
    { handle: "frostbyte", merged: 11, points: 340 },
    { handle: "you", merged: 9, points: 295, gained: 25 },
    { handle: "icicle-js", merged: 10, points: 270 },
  ] as { handle: string; merged: number; points: number; gained?: number }[],
};

// Sample issues for the repository mock in the Maintainers section.
export const repoPreview = {
  name: "your-org/your-project",
  openIssues: 12,
  pullRequests: 4,
  issues: [
    {
      title: "Fix broken link in the setup guide",
      labels: ["mergio:level-1", "good first issue"],
      assignee: "icicle-js",
    },
    {
      title: "Add keyboard shortcuts to the editor",
      labels: ["mergio:level-2"],
      assignee: "pinecone",
    },
    {
      title: "Cache API responses on the client",
      labels: ["mergio:level-3"],
      assignee: "aurora-dev",
    },
    {
      title: "Improve README badges",
      labels: ["mergio:level-1"],
      assignee: "frostbyte",
      merged: true,
    },
  ] as {
    title: string;
    labels: string[];
    assignee: string;
    merged?: boolean;
  }[],
};

// Add `when` (e.g. "Dec 1") once a date is fixed; until then the stage number is shown.
// Mark the stage in progress with `active: true`; earlier stages render as done.
type Stage = {
  title: string;
  body: string;
  icon: IconName;
  when?: string;
  active?: boolean;
};

export const timeline: Stage[] = [
  {
    title: "Planning",
    icon: "calendar",
    body: "Team, sponsors and platform setup.",
    active: true,
  },
  {
    title: "Call for projects",
    icon: "repo",
    body: "Maintainers submit their repositories.",
  },
  {
    title: "Registration",
    icon: "github",
    body: "Sign-ups open for everyone.",
  },
  {
    title: "Onboarding",
    icon: "sprout",
    body: "Opening ceremony and Git sessions.",
  },
  {
    title: "Contribution month",
    icon: "merge",
    body: "Contribute and climb the leaderboard.",
  },
  {
    title: "Results",
    icon: "trophy",
    body: "Winners announced at the closing ceremony.",
  },
];

// Add `prize` to a place once it is confirmed; until then the podium shows "Revealing soon".
type Place = { place: string; prize?: string };

// Three groups win something: top contributors, project maintainers, and every participant.
export const prizes = {
  contributors: {
    kicker: "Contributors",
    title: "Prizes for top contributors",
    body: "Prizes, goodies and certificates of excellence for the highest scorers on the leaderboard.",
    places: [{ place: "1st" }, { place: "2nd" }, { place: "3rd" }] as Place[],
  },
  maintainers: {
    kicker: "Maintainers",
    title: "Prizes for maintainers",
    body: "Project maintainers who review, guide and merge contributions win prizes too.",
  },
  everyone: {
    kicker: "Participants",
    title: "Certificates for everyone",
    body: "Everyone who takes part in Mergio gets a certificate of participation.",
  },
  sponsor: {
    title: "Sponsor Mergio",
    body: "Help new contributors ship their first open-source work.",
    cta: "Become a sponsor",
    href: links.sponsor,
  },
};

// What we look for in a project, shown as short tiles in the Maintainers section.
export const maintainerChecks = [
  { text: "Active, open-source licensed repo", icon: "github" as const },
  { text: "README with setup steps + CONTRIBUTING", icon: "repo" as const },
  { text: "10+ open issues, some beginner-friendly", icon: "issue" as const },
  { text: "Reviews within 48 hours", icon: "clock" as const },
];

export const faqs = [
  {
    q: "Who can participate?",
    a: "Everyone. Students from any school or college, maintainers and mentors, at any skill level.",
  },
  { q: "Is there a registration fee?", a: "No. Mergio is completely free." },
  {
    q: "I have never contributed to open source. Can I join?",
    a: "Yes. Level 1 issues and our onboarding sessions are designed for first-time contributors.",
  },
  {
    q: "How are points calculated?",
    a: "Only merged pull requests with the Mergio label on approved repositories earn points: 10, 25 or 45 depending on the issue level.",
  },
  {
    q: "Do I get a certificate?",
    a: "Yes. Every participant gets a certificate, and top contributors and maintainers win prizes.",
  },
  {
    q: "When does Mergio start?",
    a: "This winter. Exact dates will be announced on this website and our social media.",
  },
  {
    q: "Can I submit my own project?",
    a: 'Yes. Use the "Submit a project" form. Projects are reviewed for documentation, open issues and maintainer availability.',
  },
];

export const organiser = "GDG on Campus KNIT Sultanpur";

export const footerFacts = [
  { value: "1 month", label: "of contributions" },
  { value: "Unlimited", label: "projects" },
  { value: "Free", label: "for everyone" },
];

export const footerColumns = [
  {
    title: "Program",
    links: navItems.map(({ id, label }) => ({ label, href: `#${id}` })),
  },
  {
    title: "Get involved",
    links: [
      { label: "Register", href: links.register },
      { label: "Submit a project", href: links.submitProject },
      { label: "Become a mentor", href: links.mentor },
      { label: "Become a sponsor", href: links.sponsor },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Discord", href: links.discord },
      { label: "Instagram", href: links.instagram },
      { label: "LinkedIn", href: links.linkedin },
      { label: "Rules", href: links.rules },
      { label: "Code of conduct", href: links.codeOfConduct },
    ],
  },
];
