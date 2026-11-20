import { statusInfo, type ProjectStatusName } from "@/lib/projects";

const toneClass = {
  muted: "text-(color:--muted)",
  gold: "text-(color:--gold)",
  ice: "text-(color:--ice)",
  green: "text-(color:--green)",
  red: "text-[#E5484D]",
} as const;

export function StatusBadge({ status }: { status: ProjectStatusName }) {
  const info = statusInfo[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-(color:--border-strong) px-3 py-1 font-mono text-xs tracking-wide uppercase ${toneClass[info.tone]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {info.label}
    </span>
  );
}
