import Link from "next/link";
import type { Metadata } from "next";
import { IconSprite } from "@/components/landing/art/icon-sprite";
import { Icon } from "@/components/landing/icon";
import { ThemeToggle } from "@/components/landing/theme-toggle";

// Account pages are for signed-in people and have no use in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <IconSprite />
      <div className="auth-page">
        <div className="wrap auth-top">
          <Link className="brand" href="/" aria-label="Mergio home">
            <span className="brand-mark">
              <Icon name="flake" size={14} />
            </span>
            Mergio
          </Link>
          <ThemeToggle />
        </div>
        <main className="wrap auth-main">{children}</main>
      </div>
    </>
  );
}
