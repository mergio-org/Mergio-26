"use server";

import { createSponsorInquiry } from "@/lib/content-service";

export type InquiryState = { done?: boolean; error?: string; errors?: Record<string, string> };

export async function sponsorInquiryAction(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  const input = Object.fromEntries(
    ["name", "email", "organization", "message"].map((key) => [key, form.get(key)?.toString() ?? ""]),
  );
  const result = await createSponsorInquiry(input);
  if (result.ok) return { done: true };
  return { error: result.message, errors: result.errors };
}
