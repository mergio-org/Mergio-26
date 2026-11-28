"use client";

import { useState } from "react";
import { replayDelivery, resyncRepo } from "@/app/webhooks/actions";
import { RotateCw, RefreshCw } from "lucide-react";

export function ReplayButton({ deliveryId }: { deliveryId: string }) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReplay() {
    setPending(true);
    setDone(false);
    await replayDelivery(deliveryId);
    setPending(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <button
      onClick={handleReplay}
      disabled={pending}
      title="Replay this webhook delivery"
      className="btn-secondary !min-h-[30px] !px-2.5 !py-1 text-xs disabled:opacity-50"
    >
      <RotateCw className={`h-3 w-3 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Replaying..." : done ? "Replayed!" : "Replay"}
    </button>
  );
}

export function ResyncRepoButton({
  installationId,
  repoFullName,
}: {
  installationId: string;
  repoFullName?: string;
}) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleResync() {
    setPending(true);
    setDone(false);
    await resyncRepo(installationId, repoFullName);
    setPending(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <button
      onClick={handleResync}
      disabled={pending}
      className="btn-ice text-xs disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${pending ? "animate-spin" : ""}`} />
      {pending ? "Resyncing..." : done ? "Synced!" : "Resync Repo"}
    </button>
  );
}
