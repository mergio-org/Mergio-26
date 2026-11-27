import Link from "next/link";
import { ContentMarkdown } from "@/components/site/content-markdown";
import { EmptyState, PageHead } from "@/components/site/page-head";
import { getPublicItems } from "@/lib/content-service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Answers to common questions about Mergio, the winter open-source program.",
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await getPublicItems("faq");
  return (
    <div className="w-full max-w-3xl">
      <PageHead title="Frequently asked questions">Everything you need to know before you join.</PageHead>
      {faqs.length ? (
        <div className="faq-list flex flex-col gap-3">
          {faqs.map((faq, i) => (
            <details key={`${i}-${faq.question}`} className="faq-item">
              <summary>
                <span className="faq-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="faq-q">{faq.question}</span>
                <span className="faq-toggle" aria-hidden="true" />
              </summary>
              <ContentMarkdown className="faq-a">{faq.answer}</ContentMarkdown>
            </details>
          ))}
        </div>
      ) : (
        <EmptyState title="No questions yet">Questions will appear here soon.</EmptyState>
      )}
      <p className="mt-6 text-(color:--muted)">
        Still stuck? Read the <Link className="underline" href="/code-of-conduct">code of conduct</Link> or ask the team on Discord.
      </p>
    </div>
  );
}
