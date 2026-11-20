import { ownerAvatar } from "@/lib/projects";

// The project's own logo if it set one, otherwise its first repo owner's GitHub avatar.
export function ProjectLogo({
  logoUrl,
  owner,
  name,
  size = 56,
}: {
  logoUrl: string | null;
  owner: string | undefined;
  name: string;
  size?: number;
}) {
  const src = logoUrl ?? (owner ? ownerAvatar(owner) : null);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- remote logo or GitHub avatar, no loader configured
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="flex-none rounded-xl border border-(color:--border-strong) bg-(color:--surface-2) object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="grid flex-none place-items-center rounded-xl border border-(color:--border-strong) bg-(color:--surface-2) text-xl font-semibold"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
