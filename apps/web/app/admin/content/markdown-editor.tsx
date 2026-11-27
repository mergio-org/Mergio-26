"use client";

import { useRef, useState } from "react";
import { ContentMarkdown } from "@/components/site/content-markdown";
import { uploadImage } from "./upload";

// A textarea with Write / Preview tabs and an "Insert image" button that uploads to object
// storage and inserts the markdown for it at the cursor.
export function MarkdownEditor({
  id,
  name,
  value,
  onChange,
  max,
  rows = 8,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  max: number;
  rows?: number;
  invalid?: boolean;
}) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);

  async function insertImage(selected: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImage(selected);
      const at = area.current?.selectionStart ?? value.length;
      const alt = selected.name.replace(/\.[^.]+$/, "").replace(/[[\]]/g, "");
      onChange(`${value.slice(0, at)}![${alt}](${url})${value.slice(at)}`);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-3 py-1 text-sm ${active ? "bg-(color:--ice-soft) text-(color:--text)" : "text-(color:--muted) hover:text-(color:--text)"}`;

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Editor mode" className="flex gap-1">
          <button type="button" role="tab" aria-selected={tab === "write"} className={tabClass(tab === "write")} onClick={() => setTab("write")}>
            Write
          </button>
          <button type="button" role="tab" aria-selected={tab === "preview"} className={tabClass(tab === "preview")} onClick={() => setTab("preview")}>
            Preview
          </button>
        </div>
        <button
          type="button"
          className="ml-auto rounded-full border border-(color:--border-strong) px-3 py-1 text-sm text-(color:--muted) hover:text-(color:--text)"
          disabled={uploading}
          onClick={() => file.current?.click()}
        >
          {uploading ? "Uploading…" : "Insert image"}
        </button>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          className="hidden"
          onChange={(event) => event.target.files?.[0] && insertImage(event.target.files[0])}
        />
      </div>
      {tab === "write" ? (
        <textarea
          ref={area}
          id={id}
          name={name}
          rows={rows}
          value={value}
          maxLength={max}
          aria-invalid={invalid || undefined}
          className="font-mono"
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <div className="min-h-24 rounded-[10px] border border-(color:--border-strong) bg-(color:--surface-2) p-4">
          {value.trim() ? <ContentMarkdown>{value}</ContentMarkdown> : <p className="m-0 text-(color:--dim)">Nothing to preview.</p>}
        </div>
      )}
      <p className="field-hint">
        Markdown: **bold**, _italic_, [link](https://…), - lists, ## headings. {value.length.toLocaleString("en")}/
        {max.toLocaleString("en")}
      </p>
      {uploadError && <p className="field-error" role="alert">{uploadError}</p>}
    </div>
  );
}
