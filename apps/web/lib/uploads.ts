import "server-only";
import { createHash, createHmac, randomUUID } from "node:crypto";

// Image uploads for site content (sponsor logos, team photos, images in pages) go straight from
// the organizer's browser to S3-compatible object storage (AWS S3 or Cloudflare R2) with a
// presigned PUT URL, so files never pass through this server. Signed with AWS Signature V4.
//
// Env: S3_ENDPOINT (e.g. https://<account>.r2.cloudflarestorage.com, or https://s3.<region>.amazonaws.com),
// S3_REGION ("auto" for R2), S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_PUBLIC_URL,
// the public base URL the bucket is served from (an R2 public bucket / custom domain or CloudFront).
// The bucket needs a CORS rule allowing PUT from the site's origin with a Content-Type header.

export const UPLOAD_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const EXPIRES_SECONDS = 300;

function config() {
  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_PUBLIC_URL) return null;
  return {
    endpoint: S3_ENDPOINT.replace(/\/+$/, ""),
    region: S3_REGION || "auto",
    bucket: S3_BUCKET,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    publicUrl: S3_PUBLIC_URL.replace(/\/+$/, ""),
  };
}

export const uploadsConfigured = () => config() !== null;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const hmac = (key: Buffer | string, value: string) => createHmac("sha256", key).update(value).digest();
// RFC 3986 encoding, as SigV4 requires.
const encode = (value: string) =>
  encodeURIComponent(value).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export type PresignResult =
  | { ok: true; data: { uploadUrl: string; publicUrl: string; key: string; headers: Record<string, string>; expiresIn: number } }
  | { ok: false; status: number; message: string };

/** A presigned PUT URL for one image. The browser must send exactly `headers` with the upload. */
export function presignImageUpload(contentType: unknown, size: unknown, now = new Date()): PresignResult {
  const cfg = config();
  if (!cfg) return { ok: false, status: 503, message: "Image uploads are not configured (S3_* env vars)." };
  if (typeof contentType !== "string" || !UPLOAD_TYPES[contentType]) {
    return { ok: false, status: 400, message: "Upload a PNG, JPEG, WebP, GIF, AVIF or SVG image." };
  }
  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0 || size > MAX_UPLOAD_BYTES) {
    return { ok: false, status: 400, message: "Images must be at most 5 MB." };
  }

  const key = `content/${now.toISOString().slice(0, 7)}/${randomUUID()}.${UPLOAD_TYPES[contentType]}`;
  const url = new URL(`${cfg.endpoint}/${cfg.bucket}/${key}`);
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const scope = `${day}/${cfg.region}/s3/aws4_request`;
  // Content-Type and Content-Length are signed, so the URL can't be reused for another file type or size.
  const signedHeaders = "content-length;content-type;host";
  const query: [string, string][] = (
    [
      ["X-Amz-Algorithm", "AWS4-HMAC-SHA256"],
      ["X-Amz-Credential", `${cfg.accessKeyId}/${scope}`],
      ["X-Amz-Date", amzDate],
      ["X-Amz-Expires", String(EXPIRES_SECONDS)],
      ["X-Amz-SignedHeaders", signedHeaders],
    ] as [string, string][]
  ).sort(([a], [b]) => (a < b ? -1 : 1));
  const canonicalQuery = query.map(([k, v]) => `${encode(k)}=${encode(v)}`).join("&");
  const canonicalPath = url.pathname.split("/").map((part) => encode(decodeURIComponent(part))).join("/");
  const canonicalRequest = [
    "PUT",
    canonicalPath,
    canonicalQuery,
    `content-length:${size}\ncontent-type:${contentType}\nhost:${url.host}\n`,
    signedHeaders,
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonicalRequest)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, day), cfg.region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    ok: true,
    data: {
      uploadUrl: `${url.origin}${canonicalPath}?${canonicalQuery}&X-Amz-Signature=${signature}`,
      publicUrl: `${cfg.publicUrl}/${key}`,
      key,
      // Content-Length is set by the browser from the body; only Content-Type needs sending.
      headers: { "Content-Type": contentType },
      expiresIn: EXPIRES_SECONDS,
    },
  };
}
