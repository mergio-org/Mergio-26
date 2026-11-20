import type { Metadata } from "next";
import { SkyShell } from "@/components/site/sky-shell";

// Account pages are for signed-in people and have no use in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SkyShell>{children}</SkyShell>;
}
