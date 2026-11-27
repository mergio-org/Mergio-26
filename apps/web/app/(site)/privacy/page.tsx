import { LongPage, longPageMetadata } from "@/components/site/long-page";

export const generateMetadata = () => longPageMetadata("privacy");

export default function Page() {
  return <LongPage slug="privacy" />;
}
