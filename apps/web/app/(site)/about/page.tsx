import { LongPage, longPageMetadata } from "@/components/site/long-page";

export const generateMetadata = () => longPageMetadata("about");

export default function Page() {
  return <LongPage slug="about" />;
}
