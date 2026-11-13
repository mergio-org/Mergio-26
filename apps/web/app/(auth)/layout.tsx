import Link from "next/link";
import type { Metadata } from "next";
import { DayClouds } from "@/components/landing/art/day-clouds";
import { IconSprite } from "@/components/landing/art/icon-sprite";
import { Moon } from "@/components/landing/art/moon";
import { Stars } from "@/components/landing/art/stars";
import { WinterScene } from "@/components/landing/art/winter-scene";
import { Icon } from "@/components/landing/icon";
import { HeroSnow } from "@/components/landing/snow";
import { ThemeToggle } from "@/components/landing/theme-toggle";

// Account pages are for signed-in people and have no use in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Same winter sky as the landing hero (night in dark mode, day in light mode), so the
// account pages feel like part of the site.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <IconSprite />
      <div className="auth-page">
        <div className="aurora" aria-hidden="true" />
        <Stars />
        <div className="day-sun" aria-hidden="true" />
        <DayClouds />
        <Moon />
        <HeroSnow />
        <WinterScene />
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
