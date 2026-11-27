import { LongPage, longPageMetadata } from "@/components/site/long-page";

export const generateMetadata = () => longPageMetadata("code-of-conduct");

export default function Page() {
  return <LongPage slug="code-of-conduct" />;
}
