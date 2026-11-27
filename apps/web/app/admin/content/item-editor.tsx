"use client";

import { useState, useTransition } from "react";
import { CONTENT_KINDS, type ContentItemJson, type ContentKindKey, type Field } from "@/lib/site-content";
import {
  deleteItemAction,
  importDefaultsAction,
  moveItemAction,
  saveItemAction,
  type ContentActionResult,
} from "./actions";
import { ImageField } from "./image-field";
import { MarkdownEditor } from "./markdown-editor";

type Values = Record<string, string | boolean>;

function initialValues(fields: readonly Field[], data?: Record<string, unknown>): Values {
  return Object.fromEntries(
    fields.map((field) => {
      const value = data?.[field.name];
      if (field.type === "checkbox") return [field.name, value === true];
      if (field.type === "select" && value === undefined && field.required) return [field.name, field.options[0]!.value];
      return [field.name, typeof value === "string" ? value : ""];
    }),
  );
}

function ItemForm({
  kind,
  item,
  onDone,
}: {
  kind: ContentKindKey;
  item?: ContentItemJson;
  onDone: () => void;
}) {
  const spec = CONTENT_KINDS[kind];
  const fields = spec.fields as readonly Field[];
  const [values, setValues] = useState(() => initialValues(fields, item?.data as Record<string, unknown> | undefined));
  const [result, setResult] = useState<ContentActionResult>({});
  const [pending, start] = useTransition();
  const set = (name: string, value: string | boolean) => setValues((current) => ({ ...current, [name]: value }));
  const prefix = `${kind}-${item?.id ?? "new"}`;

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        start(async () => {
          const next = await saveItemAction(kind, item?.id ?? null, values);
          setResult(next);
          if (!next.error) onDone();
        });
      }}
    >
      {result.error && (
        <p className="form-alert" role="alert">
          {result.error}
        </p>
      )}
      {fields.map((field) => {
        const id = `${prefix}-${field.name}`;
        const error = result.errors?.[field.name];
        const value = values[field.name];
        if (field.type === "checkbox") {
          return (
            <label key={field.name} className="check">
              <input type="checkbox" checked={value === true} onChange={(event) => set(field.name, event.target.checked)} />
              <span>
                {field.label}
                {field.hint && <span className="block text-sm text-(color:--dim)">{field.hint}</span>}
              </span>
            </label>
          );
        }
        const text = typeof value === "string" ? value : "";
        return (
          <div key={field.name} className="field">
            <label htmlFor={id}>
              {field.label}
              {!field.required && <span className="opt">optional</span>}
            </label>
            {field.type === "markdown" ? (
              <MarkdownEditor id={id} name={field.name} value={text} max={field.max} invalid={!!error} onChange={(v) => set(field.name, v)} />
            ) : field.type === "image" ? (
              <ImageField id={id} value={text} invalid={!!error} onChange={(v) => set(field.name, v)} />
            ) : field.type === "select" ? (
              <select id={id} value={text} aria-invalid={!!error || undefined} onChange={(event) => set(field.name, event.target.value)}>
                {!field.required && <option value="">—</option>}
                {field.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type={field.type === "url" ? "url" : "text"}
                value={text}
                maxLength={field.type === "text" ? field.max : 2048}
                aria-invalid={!!error || undefined}
                onChange={(event) => set(field.name, event.target.value)}
              />
            )}
            {error ? <p className="field-error">{error}</p> : field.hint && field.type !== "markdown" && <p className="field-hint">{field.hint}</p>}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? "Saving…" : item ? "Save and publish" : `Add ${spec.singular}`}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Lists a kind's items with edit, delete and move controls, plus an add form. */
export function ItemEditor({
  kind,
  items,
  defaults,
}: {
  kind: ContentKindKey;
  items: ContentItemJson[];
  /** Built-in copy the public site shows while `items` is empty. */
  defaults: Record<string, unknown>[];
}) {
  const spec = CONTENT_KINDS[kind];
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const act = (work: () => Promise<ContentActionResult>) =>
    start(async () => {
      const result = await work();
      setMessage(result.error ?? result.done ?? null);
    });
  const title = (data: Record<string, unknown>) => String(data[spec.titleField] ?? "");

  return (
    <div className="flex flex-col gap-4">
      {message && (
        <p className="m-0 text-sm text-(color:--muted)" role="status">
          {message}
        </p>
      )}

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-(color:--border-strong) p-5">
          {defaults.length ? (
            <>
              <p className="m-0 font-medium">The site is showing the built-in {spec.label.toLowerCase()}.</p>
              <ul className="mt-2 mb-4 text-sm text-(color:--muted)">
                {defaults.map((data, i) => (
                  <li key={i}>{title(data)}</li>
                ))}
              </ul>
              <p className="mt-0 mb-4 text-sm text-(color:--muted)">
                Import it to edit, or add your own items: as soon as there is one, the built-in copy is replaced.
              </p>
              <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={() => act(() => importDefaultsAction(kind))}>
                Import built-in copy
              </button>
            </>
          ) : (
            <p className="m-0 text-(color:--muted)">No {spec.label.toLowerCase()} yet. The public page shows an empty state.</p>
          )}
        </div>
      )}

      {items.length > 0 && (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item, index) => (
            <li key={item.id} className="rounded-xl border border-(color:--border) p-4">
              {editing === item.id ? (
                <ItemForm kind={kind} item={item} onDone={() => setEditing(null)} />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-sm text-(color:--dim)">{String(index + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{title(item.data as Record<string, unknown>)}</span>
                  <div className="flex flex-wrap gap-1">
                    <button type="button" className="btn btn-ghost btn-sm" aria-label="Move up" disabled={pending || index === 0} onClick={() => act(() => moveItemAction(kind, item.id, -1))}>
                      ↑
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" aria-label="Move down" disabled={pending || index === items.length - 1} onClick={() => act(() => moveItemAction(kind, item.id, 1))}>
                      ↓
                    </button>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(item.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={pending}
                      onClick={() => {
                        if (confirm(`Delete "${title(item.data as Record<string, unknown>)}"? It disappears from the site immediately.`)) {
                          act(() => deleteItemAction(kind, item.id));
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {editing === "new" ? (
        <div className="rounded-xl border border-(color:--border-strong) p-4">
          <ItemForm kind={kind} onDone={() => setEditing(null)} />
        </div>
      ) : (
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing("new")}>
            + Add {spec.singular}
          </button>
        </div>
      )}
    </div>
  );
}
