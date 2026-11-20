import "server-only";
import { after } from "next/server";
import { prisma, type Prisma } from "@repo/db";

// Transactional email through an outbox. queueEmail() writes the email in the same database
// transaction as the change it reports, so an email is never lost or sent for a change that
// rolled back. deliverAfterResponse() sends it once the response has gone out, through Resend's
// HTTP API. Rows still PENDING (no API key yet, or a failed attempt) can be retried later; F-13
// adds the retry worker.

const MAX_ATTEMPTS = 5;

export type Email = {
  toEmail: string;
  toUserId?: string | null;
  /** What the email is about, e.g. "project-status" (F-13 lets people mute categories). */
  category: string;
  subject: string;
  text: string;
  html: string;
};

/** Writes an email to the outbox inside a transaction and returns its id. */
export async function queueEmail(tx: Prisma.TransactionClient, email: Email) {
  const row = await tx.emailOutbox.create({ data: email, select: { id: true } });
  return row.id;
}

/** Sends queued emails once the current response has finished (server actions and route handlers). */
export function deliverAfterResponse(ids: string[]) {
  if (ids.length) after(() => deliverEmails(ids));
}

/** Tries to send each PENDING email once. Never throws: failures are recorded on the row. */
export async function deliverEmails(ids: string[]) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Mergio <noreply@mergio.in>";
  const rows = await prisma.emailOutbox.findMany({ where: { id: { in: ids }, status: "PENDING" } });

  for (const row of rows) {
    if (!apiKey) {
      // Development, or production before email is set up: keep it queued and say so.
      console.info(`[email] RESEND_API_KEY is not set; queued "${row.subject}" (outbox ${row.id})`);
      await prisma.emailOutbox.update({
        where: { id: row.id },
        data: { lastError: "RESEND_API_KEY is not set" },
      });
      continue;
    }
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          // A retry of the same outbox row is never delivered twice.
          "Idempotency-Key": row.id,
        },
        body: JSON.stringify({
          from,
          to: [row.toEmail],
          subject: row.subject,
          text: row.text,
          html: row.html,
        }),
      });
      if (response.ok) {
        await prisma.emailOutbox.update({
          where: { id: row.id },
          data: { status: "SENT", sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
        });
        continue;
      }
      await recordFailure(row.id, row.attempts, `Resend answered ${response.status}: ${(await response.text()).slice(0, 300)}`);
    } catch (error) {
      await recordFailure(row.id, row.attempts, error instanceof Error ? error.message : String(error));
    }
  }
}

async function recordFailure(id: string, attempts: number, message: string) {
  console.error(`[email] outbox ${id} failed: ${message}`);
  await prisma.emailOutbox.update({
    where: { id },
    data: {
      attempts: { increment: 1 },
      lastError: message,
      status: attempts + 1 >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
    },
  });
}

/** Escapes text for use inside the HTML email body. */
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
