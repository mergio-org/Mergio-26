import Image from "next/image";

// The GDG on Campus KNIT logo in both variants: white wordmark for the night (dark) theme,
// dark wordmark for the day (light) theme. CSS shows the one that matches data-theme.
export function GdgLogo({ className }: { className: string }) {
  const alt = "Google Developer Groups on Campus KNIT";
  return (
    <>
      <Image
        className={`${className} logo-night`}
        src="/Google Developer Groups On Campus KNIT Logo (1).png"
        alt={alt}
        width={1721}
        height={306}
        priority
      />
      <Image
        className={`${className} logo-day`}
        src="/gdg-knit-logo-light.png"
        alt={alt}
        width={1721}
        height={306}
      />
    </>
  );
}
