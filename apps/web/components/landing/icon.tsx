export type IconName =
  | "flake"
  | "github"
  | "check"
  | "chev"
  | "merge"
  | "pr"
  | "repo"
  | "issue"
  | "mentor"
  | "trophy"
  | "calendar"
  | "clock"
  | "sprout"
  | "chart"
  | "award"
  | "help";

// Renders an icon from the shared sprite in <IconSprite />.
export function Icon({
  name,
  size,
  className,
}: {
  name: IconName;
  size: number;
  className?: string;
}) {
  return (
    <svg className={className} width={size} height={size} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
