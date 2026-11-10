import type { ReactNode } from "react";
import { Icon, type IconName } from "./icon";

// Section label pill: a glowing ice badge with the section's icon, then the label, inside an
// aurora-gradient outline. Echoes the hero's "Winter edition" pill.
export function Eyebrow({
  children,
  icon = "flake",
}: {
  children: ReactNode;
  icon?: IconName;
}) {
  return (
    <span className="eyebrow eyebrow-pill">
      <span className="eyebrow-icon">
        <Icon name={icon} size={14} />
      </span>
      {children}
    </span>
  );
}

// `accent` is the closing phrase of the title, shown in ice blue like the hero tagline.
export function SectionHead({
  eyebrow,
  icon,
  title,
  accent,
  center,
  children,
}: {
  eyebrow: string;
  icon?: IconName;
  title: string;
  accent?: string;
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`section-head reveal${center ? " center" : ""}`}>
      <Eyebrow icon={icon}>{eyebrow}</Eyebrow>
      <h2>
        {title}
        {accent && (
          <>
            {" "}
            <span>{accent}</span>
          </>
        )}
      </h2>
      {children && <p>{children}</p>}
    </div>
  );
}
