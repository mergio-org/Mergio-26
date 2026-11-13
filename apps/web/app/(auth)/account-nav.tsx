import Link from "next/link";
import { signOutAction } from "./actions";

const tabs = [
  { key: "dashboard", href: "/dashboard", label: "Dashboard" },
  { key: "profile", href: "/profile", label: "My profile" },
] as const;

export function AccountNav({ active }: { active: (typeof tabs)[number]["key"] }) {
  return (
    <nav aria-label="Account" className="mb-6 flex items-center gap-3">
      <div className="flex gap-1 rounded-full border border-(color:--border-strong) p-1">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab.key === active
                ? "bg-(color:--ice-soft) text-(color:--text)"
                : "text-(color:--muted) hover:text-(color:--text)"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <form action={signOutAction} className="ml-auto">
        <button className="btn btn-ghost btn-sm" type="submit">
          Sign out
        </button>
      </form>
    </nav>
  );
}
