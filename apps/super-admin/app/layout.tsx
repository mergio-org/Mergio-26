import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Sidebar } from "@/components/sidebar";
import { getSession } from "@/lib/dal";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: { template: "%s | Mergio Admin", default: "Mergio Admin" },
  description: "Organizer admin console for the Mergio open-source programme",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="admin-shell flex min-h-screen">
          {session && (
            <Sidebar
              user={
                session.user as {
                  name: string;
                  email: string;
                  image?: string | null;
                  githubLogin?: string | null;
                }
              }
            />
          )}
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
