import type { Metadata } from "next";

// Per-page SEO and Open Graph tags for the public pages. The root layout sets metadataBase,
// so `path` resolves to an absolute URL.
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const full = `${title} — Mergio`;
  return {
    title: full,
    description,
    alternates: { canonical: path },
    openGraph: { title: full, description, url: path, type: "website", siteName: "Mergio" },
    twitter: { card: "summary_large_image", title: full, description },
  };
}
