"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CalendarDays,
  Webhook,
  Star,
  Download,
  ScrollText,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Review Queues",
    href: "/queues",
    icon: ClipboardList,
    children: [
      { label: "Project Review", href: "/queues/projects" },
      { label: "Mentor Approval", href: "/queues/mentors" },
    ],
  },
  {
    label: "Users & Ledger",
    href: "/users",
    icon: Users,
  },
  {
    label: "Seasons & Events",
    href: "/seasons",
    icon: CalendarDays,
  },
  {
    label: "Score Management",
    href: "/scores",
    icon: Star,
  },
  {
    label: "Webhook Health",
    href: "/webhooks",
    icon: Webhook,
  },
  {
    label: "Data Exports",
    href: "/exports",
    icon: Download,
  },
  {
    label: "Audit Trail",
    href: "/audit",
    icon: ScrollText,
  },
];

export function Sidebar({
  user,
}: {
  user: {
    name: string;
    email: string;
    image?: string | null;
    githubLogin?: string | null;
  };
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-r backdrop-blur-md"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand header */}
      <div
        className="flex h-16 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--border)" }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
            style={{
              background: "var(--ice-soft)",
              border: "1px solid rgba(140, 203, 255, 0.3)",
              color: "var(--ice)",
            }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight" style={{ color: "var(--text)" }}>
                Mergio
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: "var(--ice-soft)",
                  color: "var(--ice)",
                }}
              >
                ADMIN
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--dim)" }}>
              GDG on Campus KNIT
            </p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all"
                  style={{
                    backgroundColor: active ? "var(--ice-soft)" : "transparent",
                    color: active ? "var(--ice)" : "var(--muted)",
                    border: active
                      ? "1px solid rgba(140, 203, 255, 0.25)"
                      : "1px solid transparent",
                  }}
                >
                  <Icon
                    className="h-4 w-4 shrink-0"
                    style={{ color: active ? "var(--ice)" : "var(--dim)" }}
                  />
                  <span className="flex-1">{item.label}</span>
                  {item.children && (
                    <ChevronRight
                      className={`h-3.5 w-3.5 transition-transform ${
                        active ? "rotate-90" : ""
                      }`}
                      style={{ color: "var(--dim)" }}
                    />
                  )}
                </Link>

                {/* Sub-nav for queues */}
                {item.children && active && (
                  <ul
                    className="my-1 ml-4 space-y-1 border-l pl-3"
                    style={{ borderColor: "var(--border)" }}
                  >
                    {item.children.map((sub) => {
                      const subActive = pathname === sub.href;
                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            className="block rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                            style={{
                              color: subActive ? "var(--ice)" : "var(--dim)",
                              fontWeight: subActive ? 600 : 400,
                              backgroundColor: subActive
                                ? "var(--ice-soft)"
                                : "transparent",
                            }}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin Actor Card */}
      <div
        className="border-t p-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex items-center gap-3 rounded-xl p-2.5"
          style={{
            backgroundColor: "var(--surface-2)",
            border: "1px solid var(--border)",
          }}
        >
          {user.image ? (
            <img
              src={user.image}
              alt={user.name}
              className="h-8 w-8 rounded-full object-cover"
              style={{ border: "1px solid var(--border-strong)" }}
            />
          ) : (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "var(--ice-soft)",
                color: "var(--ice)",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold" style={{ color: "var(--text)" }}>
              {user.name}
            </p>
            <p className="truncate text-[11px]" style={{ color: "var(--dim)" }}>
              {user.githubLogin ? `@${user.githubLogin}` : user.email}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
