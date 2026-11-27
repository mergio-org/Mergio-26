import { LongPage, longPageMetadata } from "@/components/site/long-page";

export const generateMetadata = () => longPageMetadata("terms");

export default function Page() {
  return <LongPage slug="terms" />;
}
