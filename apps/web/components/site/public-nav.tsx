import Link from "next/link";

export const PUBLIC_NAV = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/sponsors", label: "Sponsors" },
  { href: "/team", label: "Team" },
  { href: "/leaderboard", label: "Leaderboard" },
];

const pill =
  "shrink-0 rounded-full px-3 py-1.5 text-(color:--muted) transition-colors hover:text-(color:--text)";

/** Top navigation for the public pages: inline from 640 px, a scrollable row under the header below that. */
export function PublicNav({ account }: { account: { href: string; label: string } }) {
  return (
    <nav aria-label="Site" className="hidden items-center gap-1 text-sm font-medium sm:flex">
      {PUBLIC_NAV.map((item) => (
        <Link key={item.href} href={item.href} className={pill}>
          {item.label}
        </Link>
      ))}
      <Link href={account.href} className={pill}>
        {account.label}
      </Link>
    </nav>
  );
}

export function MobileNav({ account }: { account: { href: string; label: string } }) {
  return (
    <nav
      aria-label="Site"
      className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 text-sm font-medium sm:hidden"
    >
      {[...PUBLIC_NAV, account].map((item) => (
        <Link key={item.href} href={item.href} className={`${pill} border border-(color:--border-strong)`}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

const FOOTER = [
  { href: "/", label: "Home" },
  ...PUBLIC_NAV,
  { href: "/code-of-conduct", label: "Code of conduct" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function PublicFooterLinks() {
  return (
    <nav aria-label="Footer" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm text-(color:--muted)">
      {FOOTER.map((item) => (
        <Link key={item.href} href={item.href} className="hover:text-(color:--text)">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
