"use client";

import { useState, useTransition } from "react";
import { PAGE_LIMITS, type PageContent } from "@/lib/site-content";
import { resetPageAction, savePageAction, type ContentActionResult } from "./actions";
import { MarkdownEditor } from "./markdown-editor";

export function PageEditor({ page }: { page: PageContent }) {
  const [values, setValues] = useState({ title: page.title, description: page.description, body: page.body });
  const [result, setResult] = useState<ContentActionResult>({});
  const [pending, start] = useTransition();
  const id = (name: string) => `page-${page.slug}-${name}`;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => setResult(await savePageAction(page.slug, values)));
      }}
    >
      {(result.error || result.done) && (
        <p className={result.error ? "form-alert" : "m-0 text-sm text-(color:--muted)"} role={result.error ? "alert" : "status"}>
          {result.error ?? result.done}
        </p>
      )}
      <div className="field">
        <label htmlFor={id("title")}>Title</label>
        <input id={id("title")} value={values.title} maxLength={PAGE_LIMITS.title} aria-invalid={!!result.errors?.title || undefined} onChange={(e) => setValues({ ...values, title: e.target.value })} />
        {result.errors?.title && <p className="field-error">{result.errors.title}</p>}
      </div>
      <div className="field">
        <label htmlFor={id("description")}>
          Description <span className="opt">shown under the title and in search results</span>
        </label>
        <input id={id("description")} value={values.description} maxLength={PAGE_LIMITS.description} onChange={(e) => setValues({ ...values, description: e.target.value })} />
        {result.errors?.description && <p className="field-error">{result.errors.description}</p>}
      </div>
      <div className="field">
        <label htmlFor={id("body")}>Body</label>
        <MarkdownEditor id={id("body")} name="body" rows={18} max={PAGE_LIMITS.body} value={values.body} invalid={!!result.errors?.body} onChange={(body) => setValues({ ...values, body })} />
        {result.errors?.body && <p className="field-error">{result.errors.body}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Publishing…" : "Publish"}
        </button>
        <a className="btn btn-ghost btn-sm" href={`/${page.slug}`} target="_blank" rel="noopener">
          View page
        </a>
        {page.updatedAt && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={pending}
            onClick={() => {
              if (confirm("Discard your edits to this page and go back to the built-in copy?")) {
                start(async () => {
                  setResult(await resetPageAction(page.slug));
                  window.location.reload();
                });
              }
            }}
          >
            Reset to built-in copy
          </button>
        )}
      </div>
    </form>
  );
}
