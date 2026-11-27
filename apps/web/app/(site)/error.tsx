"use client";

import Link from "next/link";

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="panel w-full max-w-xl p-8" role="alert">
      <h1 className="m-0 text-2xl font-semibold">This page didn&apos;t load</h1>
      <p className="mt-2 text-(color:--muted)">Something went wrong on our side. Try again in a moment.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-ghost btn-sm">
          Go home
        </Link>
      </div>
    </section>
  );
}
