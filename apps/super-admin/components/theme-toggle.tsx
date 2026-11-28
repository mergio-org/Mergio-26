"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

const isLight = () =>
  document.documentElement.getAttribute("data-theme") === "light";

export function ThemeToggle() {
  const light = useSyncExternalStore(subscribe, isLight, () => false);

  function toggle() {
    const root = document.documentElement;
    const next = !light;
    root.classList.add("theme-anim");
    if (next) root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next ? "light" : "dark");
    } catch {
      // Storage blocked fallback
    }
    setTimeout(() => root.classList.remove("theme-anim"), 600);
  }

  return (
    <button
      className="theme-btn"
      type="button"
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      aria-pressed={light}
      onClick={toggle}
      title={light ? "Switch to Winter Night" : "Switch to Winter Day"}
    >
      {/* Moon icon for dark mode */}
      <svg
        className="i-moon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
      {/* Sun icon for light mode */}
      <svg
        className="i-sun"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
