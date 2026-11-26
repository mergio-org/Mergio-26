import { ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

export const metadata = { title: "Organizer Authentication" };

export default function LoginPage() {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="panel w-full max-w-md p-8 shadow-2xl">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl shadow-sm"
          style={{
            backgroundColor: "var(--ice-soft)",
            border: "1px solid rgba(140, 203, 255, 0.3)",
            color: "var(--ice)",
          }}
        >
          <Sparkles className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Organizer Admin Access
        </h1>
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          To access the Mergio Operations Console, authenticate with your authorized GitHub administrator profile.
        </p>

        <div className="mt-6">
          <a
            href={`${webUrl}/register`}
            className="btn-ice w-full !py-3 !text-sm"
          >
            Authenticate with GitHub <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        <p className="mt-5 text-[11px]" style={{ color: "var(--dim)" }}>
          Your GitHub username must be listed in <code className="font-mono" style={{ color: "var(--ice)" }}>ADMIN_GITHUB_LOGINS</code> or designated as an organizer.
        </p>
      </div>
    </div>
  );
}
