"use client";

// Uploads an image straight to object storage: asks the API for a presigned PUT URL, then PUTs
// the file. Returns the public URL to store in the content.
export async function uploadImage(file: File): Promise<string> {
  const response = await fetch("/api/v1/admin/content/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message ?? "Couldn't start the upload.");
  const put = await fetch(body.uploadUrl, { method: "PUT", headers: body.headers, body: file });
  if (!put.ok) throw new Error("The upload failed. Check the bucket's CORS settings.");
  return body.publicUrl as string;
}
