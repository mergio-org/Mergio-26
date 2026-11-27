import { getPage } from "@/lib/content-service";
import { formatDate } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import type { PageSlug } from "@/lib/site-content";
import { ContentMarkdown } from "./content-markdown";
import { PageHead } from "./page-head";

// A markdown page edited at /admin/content (about, code of conduct, privacy, terms).
export async function longPageMetadata(slug: PageSlug) {
  const page = await getPage(slug);
  return pageMetadata({ title: page.title, description: page.description, path: `/${slug}` });
}

export async function LongPage({ slug }: { slug: PageSlug }) {
  const page = await getPage(slug);
  return (
    <article className="w-full max-w-3xl">
      <PageHead title={page.title}>{page.description || undefined}</PageHead>
      <div className="panel p-6 sm:p-10">
        <ContentMarkdown>{page.body}</ContentMarkdown>
        {page.updatedAt && (
          <p className="mt-8 mb-0 text-sm text-(color:--dim)">Updated {formatDate(new Date(page.updatedAt))}</p>
        )}
      </div>
    </article>
  );
}
