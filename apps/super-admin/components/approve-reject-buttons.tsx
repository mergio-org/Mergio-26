"use client";

import { useState } from "react";
import { approveRegistration, rejectRegistration } from "@/app/queues/actions";
import { Check, X } from "lucide-react";

export function ApproveRejectButtons({
  registrationId,
}: {
  registrationId: string;
}) {
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setPending("approve");
    await approveRegistration(registrationId);
    setPending(null);
  }

  async function handleReject() {
    setPending("reject");
    await rejectRegistration(registrationId);
    setPending(null);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleApprove}
        disabled={pending !== null}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
        style={{
          backgroundColor: "rgba(91, 212, 154, 0.15)",
          color: "var(--green)",
          border: "1px solid rgba(91, 212, 154, 0.35)",
        }}
      >
        <Check className="h-3.5 w-3.5" />
        {pending === "approve" ? "Approving…" : "Approve"}
      </button>

      <button
        onClick={handleReject}
        disabled={pending !== null}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
        style={{
          backgroundColor: "rgba(255, 107, 107, 0.15)",
          color: "var(--red)",
          border: "1px solid rgba(255, 107, 107, 0.35)",
        }}
      >
        <X className="h-3.5 w-3.5" />
        {pending === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </div>
  );
}
