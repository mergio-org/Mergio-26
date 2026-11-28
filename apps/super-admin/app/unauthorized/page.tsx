import { Lock, ArrowLeft } from "lucide-react";

export const metadata = { title: "Access Restricted" };

export default function UnauthorizedPage() {
  const webUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div
        className="panel w-full max-w-md p-8 shadow-2xl"
        style={{ borderColor: "rgba(255, 107, 107, 0.35)" }}
      >
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 107, 107, 0.15)",
            color: "var(--red)",
          }}
        >
          <Lock className="h-7 w-7" />
        </div>

        <h1 className="mt-5 text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>
          Access Restricted
        </h1>
        <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>
          You are signed in, but your GitHub account does not currently hold administrator permissions for the Organizer Console.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <a
            href={webUrl}
            className="btn-secondary w-full !py-3 !text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Mergio Portal
          </a>
        </div>

        <p className="mt-5 text-[11px]" style={{ color: "var(--dim)" }}>
          If you are an organizer, ensure your GitHub login is added to <code className="font-mono" style={{ color: "var(--ice)" }}>ADMIN_GITHUB_LOGINS</code> in your server configuration.
        </p>
      </div>
    </div>
  );
}
