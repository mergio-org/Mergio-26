import type { Metadata } from "next";
import Link from "next/link";
import { SkyShell } from "@/components/site/sky-shell";

// Organizer pages. Each page and action checks requireAdmin() itself; a layout is not a security
// boundary because it does not re-run on every navigation.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <SkyShell
      wide
      nav={
        <nav aria-label="Admin" className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/admin/projects"
            className="rounded-full px-3 py-1.5 text-(color:--muted) transition-colors hover:text-(color:--text)"
          >
            Project reviews
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full px-3 py-1.5 text-(color:--muted) transition-colors hover:text-(color:--text)"
          >
            Dashboard
          </Link>
        </nav>
      }
    >
      {children}
    </SkyShell>
  );
}
