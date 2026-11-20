import Link from "next/link";
import { DayClouds } from "@/components/landing/art/day-clouds";
import { IconSprite } from "@/components/landing/art/icon-sprite";
import { Moon } from "@/components/landing/art/moon";
import { Stars } from "@/components/landing/art/stars";
import { WinterScene } from "@/components/landing/art/winter-scene";
import { Icon } from "@/components/landing/icon";
import { HeroSnow } from "@/components/landing/snow";
import { ThemeToggle } from "@/components/landing/theme-toggle";

// The landing hero's winter sky (night in dark mode, day in light mode) around an inner page:
// the account pages and the project pages both sit in it, so they feel like part of the site.
// `wide` lets list pages use the full content width instead of centring a single card.
export function SkyShell({
  children,
  wide,
  nav,
}: {
  children: React.ReactNode;
  wide?: boolean;
  nav?: React.ReactNode;
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
          <div className="flex items-center gap-3">
            {nav}
            <ThemeToggle />
          </div>
        </div>
        <main className={`wrap auth-main${wide ? " auth-main-wide" : ""}`}>{children}</main>
      </div>
    </>
  );
}
