"use client";

import { useRef, useState } from "react";
import { uploadImage } from "./upload";

// A URL input with an "Upload" button that fills it with the uploaded file's public URL.
export function ImageField({
  id,
  value,
  onChange,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);

  async function upload(selected: File) {
    setUploading(true);
    setError(null);
    try {
      onChange(await uploadImage(selected));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- preview of an arbitrary URL
          <img src={value} alt="" className="size-11 shrink-0 rounded-lg bg-(color:--surface-2) object-contain" />
        )}
        <input
          id={id}
          type="url"
          inputMode="url"
          placeholder="https://…"
          value={value}
          aria-invalid={invalid || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
        <button type="button" className="btn btn-ghost btn-sm shrink-0" disabled={uploading} onClick={() => file.current?.click()}>
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={file}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          className="hidden"
          onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])}
        />
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
