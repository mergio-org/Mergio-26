import "server-only";
import { after } from "next/server";
import { prisma, type Prisma } from "@repo/db";

const MAX_ATTEMPTS = 5;

export type Email = {
  toEmail: string;
  toUserId?: string | null;
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

/** Sends queued emails once the current response has finished. */
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

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
