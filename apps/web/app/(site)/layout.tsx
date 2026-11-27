import { MobileNav, PublicFooterLinks, PublicNav } from "@/components/site/public-nav";
import { SkyShell } from "@/components/site/sky-shell";
import { accountLink } from "@/lib/content";
import { getViewer } from "@/lib/dal";

// Public content pages (F-16): /about, /faq, /sponsors, /team and the legal pages. Their copy is
// edited by organizers at /admin/content and read on every request.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const account = accountLink(await getViewer());
  return (
    <SkyShell wide nav={<PublicNav account={account} />}>
      <div className="w-full min-w-0">
        <MobileNav account={account} />
        {children}
        <PublicFooterLinks />
      </div>
    </SkyShell>
  );
}
