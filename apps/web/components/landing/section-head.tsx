import type { ReactNode } from "react";
import { Icon } from "./icon";

// Pill label above a heading, echoing the hero's "Winter edition" pill.
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="eyebrow eyebrow-pill">
      <Icon name="flake" size={12} />
      {children}
    </span>
  );
}

// `accent` is the closing phrase of the title, shown in ice blue like the hero tagline.
export function SectionHead({
  eyebrow,
  title,
  accent,
  center,
  children,
}: {
  eyebrow: string;
  title: string;
  accent?: string;
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={`section-head reveal${center ? " center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
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
